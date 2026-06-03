# MIRRORBLACK — Email Verification Specification

## Agent Identity

You are a **senior full-stack engineer**. You are implementing OTP-based email verification into an existing production application called MIRRORBLACK. Read this entire document before writing a single line of code. Do not modify anything not listed here. Do not add features not specified here.

---

## Overview

This document specifies all changes required to add OTP-based email verification to MIRRORBLACK using Nodemailer + Brevo SMTP. It covers:

1. Database schema changes
2. New backend files to create
3. Existing backend files to modify
4. New frontend pages and components
5. Existing frontend files to modify

---

## Tech Added

| Layer | Technology |
|-------|-----------|
| Email sending | Nodemailer |
| SMTP provider | Brevo (smtp-relay.brevo.com) |
| OTP storage | Hashed in PostgreSQL |
| OTP length | 6 digits |
| OTP expiry | 10 minutes |
| Max wrong attempts | 3 then invalidate |
| Resend cooldown | 60 seconds |

---

## New Environment Variables

Add these to `.env` and `.env.example`:

```env
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=your-verified-sender@domain.com
BREVO_SENDER_NAME=MIRRORBLACK
```

---

## Install Command

```bash
npm install nodemailer
```

---

## Part 1 — Database Changes

### 1.1 — Schema Changes

Open `prisma/schema.prisma`. Find the `User` model. Replace it with this:

```prisma
model User {
  id             String    @id @default(uuid())
  email          String    @unique
  passwordHash   String
  isVerified     Boolean   @default(false)
  otpHash        String?
  otpExpiresAt   DateTime?
  otpAttempts    Int       @default(0)
  otpLastSentAt  DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  entries     Entry[]
  reflections Reflection[]
}
```

### 1.2 — Field Explanations

| Field | Purpose |
|-------|---------|
| `isVerified` | False until OTP confirmed. Unverified users cannot log in. |
| `otpHash` | bcrypt hash of the 6-digit OTP. Never store raw OTP. |
| `otpExpiresAt` | OTP invalid after this timestamp. |
| `otpAttempts` | Increments on wrong attempt. Invalidates OTP at 3. |
| `otpLastSentAt` | Enforces 60-second resend cooldown. |

### 1.3 — Apply Schema Changes

```bash
npx prisma db push
npx prisma generate
```

---

## Part 2 — New Backend Files

### 2.1 — `src/services/email.service.js`

Create this file. It handles all email sending via Nodemailer + Brevo SMTP.

```javascript
const nodemailer = require('nodemailer')
const { withRetry } = require('../utils/retry')

// ==================== CONFIG ====================

const CONFIG = {
  retry: {
    maxAttempts: 3,
    baseDelay: 1000
  }
}

// ==================== ENV GUARD ====================

const assertEnv = (...keys) => {
  const missing = keys.filter(key => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }
}

// ==================== LAZY SINGLETON TRANSPORTER ====================

let _transporter = null

const getTransporter = () => {
  if (!_transporter) {
    assertEnv(
      'BREVO_SMTP_HOST',
      'BREVO_SMTP_PORT',
      'BREVO_API_KEY',
      'BREVO_SENDER_EMAIL'
    )

    _transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST,
      port: Number(process.env.BREVO_SMTP_PORT),
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.BREVO_API_KEY
      }
    })
  }

  return _transporter
}

// ==================== EMAIL TEMPLATE ====================

const buildOtpTemplate = (otp) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>MIRRORBLACK — Verification</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #0a0a0a;
      color: #e8e8e8;
      font-family: 'Courier New', Courier, monospace;
      padding: 48px 24px;
    }
    .container {
      max-width: 480px;
      margin: 0 auto;
    }
    .brand {
      font-size: 13px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #888888;
      margin-bottom: 48px;
    }
    .otp-label {
      font-size: 12px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #888888;
      margin-bottom: 16px;
    }
    .otp-code {
      font-size: 48px;
      font-weight: 400;
      letter-spacing: 0.3em;
      color: #e8e8e8;
      margin-bottom: 32px;
    }
    .divider {
      border: none;
      border-top: 1px solid #1e1e1e;
      margin-bottom: 32px;
    }
    .expiry {
      font-size: 13px;
      color: #888888;
      margin-bottom: 12px;
    }
    .warning {
      font-size: 13px;
      color: #888888;
    }
    .footer {
      margin-top: 64px;
      font-size: 11px;
      color: #444444;
    }
  </style>
</head>
<body>
  <div class="container">
    <p class="brand">MIRRORBLACK</p>

    <p class="otp-label">Verification Code</p>
    <p class="otp-code">${otp}</p>

    <hr class="divider" />

    <p class="expiry">This code expires in 10 minutes.</p>
    <p class="warning">If you did not request this, ignore this email.</p>

    <p class="footer">This is an automated message. Do not reply.</p>
  </div>
</body>
</html>
  `.trim()
}

// ==================== SEND OTP EMAIL ====================

const sendOtpEmail = async (toEmail, otp) => {
  if (!toEmail || typeof toEmail !== 'string') {
    throw new Error('sendOtpEmail requires a valid email address.')
  }
  if (!otp || typeof otp !== 'string') {
    throw new Error('sendOtpEmail requires a valid OTP string.')
  }

  assertEnv('BREVO_SENDER_EMAIL', 'BREVO_API_KEY')

  return withRetry(async () => {
    const transporter = getTransporter()

    let info
    try {
      info = await transporter.sendMail({
        from: `"${process.env.BREVO_SENDER_NAME || 'MIRRORBLACK'}" <${process.env.BREVO_SENDER_EMAIL}>`,
        to: toEmail,
        subject: `${otp} — Your MIRRORBLACK verification code`,
        html: buildOtpTemplate(otp),
        text: `Your MIRRORBLACK verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, ignore this email.`
      })
    } catch (error) {
      throw new Error(`SMTP network error: ${error.message}`)
    }

    if (!info?.messageId) {
      throw new Error('Email sent but no messageId returned — verify Brevo config.')
    }

    console.log(`[Email] OTP sent to ${toEmail} — messageId: ${info.messageId}`)
    return true

  }, 'Email', CONFIG.retry)
}

// ==================== EXPORTS ====================

module.exports = { sendOtpEmail }
```

---

### 2.2 — `src/services/otp.service.js`

Create this file. It handles OTP generation, hashing, validation, and cooldown logic.

```javascript
const bcrypt = require('bcryptjs')
const prisma = require('../config/database')

// ==================== CONFIG ====================

const CONFIG = {
  otpLength: 6,
  otpExpiryMinutes: 10,
  maxAttempts: 3,
  resendCooldownSeconds: 60,
  bcryptRounds: 10
}

// ==================== GENERATORS ====================

const generateRawOtp = () => {
  const min = Math.pow(10, CONFIG.otpLength - 1)
  const max = Math.pow(10, CONFIG.otpLength) - 1
  return String(Math.floor(Math.random() * (max - min + 1)) + min)
}

const hashOtp = async (otp) => {
  return bcrypt.hash(otp, CONFIG.bcryptRounds)
}

const compareOtp = async (raw, hashed) => {
  return bcrypt.compare(raw, hashed)
}

const getOtpExpiry = () => {
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + CONFIG.otpExpiryMinutes)
  return expiry
}

// ==================== COOLDOWN CHECK ====================

const isOnCooldown = (otpLastSentAt) => {
  if (!otpLastSentAt) return false
  const secondsSinceLastSend = (Date.now() - new Date(otpLastSentAt).getTime()) / 1000
  return secondsSinceLastSend < CONFIG.resendCooldownSeconds
}

const getCooldownSecondsRemaining = (otpLastSentAt) => {
  if (!otpLastSentAt) return 0
  const secondsSinceLastSend = (Date.now() - new Date(otpLastSentAt).getTime()) / 1000
  return Math.ceil(CONFIG.resendCooldownSeconds - secondsSinceLastSend)
}

// ==================== CREATE AND STORE OTP ====================

const createOtp = async (userId) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('createOtp requires a valid userId.')
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    throw new Error('User not found.')
  }

  // Check cooldown
  if (isOnCooldown(user.otpLastSentAt)) {
    const remaining = getCooldownSecondsRemaining(user.otpLastSentAt)
    const error = new Error(`Please wait ${remaining} seconds before requesting a new code.`)
    error.status = 429
    throw error
  }

  const rawOtp = generateRawOtp()
  const otpHash = await hashOtp(rawOtp)

  await prisma.user.update({
    where: { id: userId },
    data: {
      otpHash,
      otpExpiresAt: getOtpExpiry(),
      otpAttempts: 0,
      otpLastSentAt: new Date()
    }
  })

  return rawOtp
}

// ==================== VERIFY OTP ====================

const verifyOtp = async (userId, rawOtp) => {
  if (!userId || !rawOtp) {
    throw new Error('verifyOtp requires userId and otp.')
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    throw new Error('User not found.')
  }

  // No OTP on record
  if (!user.otpHash || !user.otpExpiresAt) {
    const error = new Error('No verification code found. Please request a new one.')
    error.status = 400
    throw error
  }

  // OTP expired
  if (new Date() > new Date(user.otpExpiresAt)) {
    await prisma.user.update({
      where: { id: userId },
      data: { otpHash: null, otpExpiresAt: null, otpAttempts: 0 }
    })
    const error = new Error('Verification code has expired. Please request a new one.')
    error.status = 400
    throw error
  }

  // Max attempts exceeded
  if (user.otpAttempts >= CONFIG.maxAttempts) {
    await prisma.user.update({
      where: { id: userId },
      data: { otpHash: null, otpExpiresAt: null, otpAttempts: 0 }
    })
    const error = new Error('Too many incorrect attempts. Please request a new code.')
    error.status = 400
    throw error
  }

  // Compare OTP
  const isValid = await compareOtp(rawOtp, user.otpHash)

  if (!isValid) {
    await prisma.user.update({
      where: { id: userId },
      data: { otpAttempts: { increment: 1 } }
    })
    const attemptsLeft = CONFIG.maxAttempts - (user.otpAttempts + 1)
    const error = new Error(
      attemptsLeft > 0
        ? `Incorrect code. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`
        : 'Incorrect code. Maximum attempts reached. Please request a new code.'
    )
    error.status = 400
    throw error
  }

  // OTP valid — mark user as verified, clear OTP fields
  await prisma.user.update({
    where: { id: userId },
    data: {
      isVerified: true,
      otpHash: null,
      otpExpiresAt: null,
      otpAttempts: 0,
      otpLastSentAt: null
    }
  })

  return true
}

// ==================== EXPORTS ====================

module.exports = {
  createOtp,
  verifyOtp,
  isOnCooldown,
  getCooldownSecondsRemaining
}
```

---

## Part 3 — Modified Backend Files

### 3.1 — `src/controllers/auth.controller.js`

Add three new controller functions. Do not remove existing ones.

**Add these imports at the top:**
```javascript
const { createOtp, verifyOtp } = require('../services/otp.service')
const { sendOtpEmail } = require('../services/email.service')
const { signToken } = require('../utils/jwt')
```

**Add `sendOtp` controller:**
```javascript
const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required.' })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success — never reveal if email exists
    if (!user) {
      return res.status(200).json({
        message: 'If this email is registered, a verification code has been sent.'
      })
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'This account is already verified.' })
    }

    const rawOtp = await createOtp(user.id)
    await sendOtpEmail(user.email, rawOtp)

    res.status(200).json({
      message: 'Verification code sent.',
      userId: user.id
    })

  } catch (error) {
    if (error.status === 429) {
      return res.status(429).json({ error: error.message })
    }
    next(error)
  }
}
```

**Add `verifyEmail` controller:**
```javascript
const verifyEmail = async (req, res, next) => {
  try {
    const { userId, otp } = req.body

    if (!userId || !otp) {
      return res.status(400).json({ error: 'userId and otp are required.' })
    }

    await verifyOtp(userId, otp)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, createdAt: true }
    })

    const token = signToken(user.id)

    res.status(200).json({
      message: 'Email verified successfully.',
      token,
      user
    })

  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message })
    }
    next(error)
  }
}
```

**Add `resendOtp` controller:**
```javascript
const resendOtp = async (req, res, next) => {
  try {
    const { userId } = req.body

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required.' })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return res.status(404).json({ error: 'User not found.' })
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'This account is already verified.' })
    }

    const rawOtp = await createOtp(user.id)
    await sendOtpEmail(user.email, rawOtp)

    res.status(200).json({ message: 'Verification code resent.' })

  } catch (error) {
    if (error.status === 429) {
      return res.status(429).json({ error: error.message })
    }
    next(error)
  }
}
```

**Update `module.exports` at the bottom:**
```javascript
module.exports = {
  register,
  login,
  getMe,
  sendOtp,
  verifyEmail,
  resendOtp
}
```

---

### 3.2 — Modify `register` in `auth.controller.js`

The register function must send OTP after creating the user. Replace the final `res.status(201)` block:

```javascript
// After user is created — send OTP, do not return JWT yet
const rawOtp = await createOtp(user.id)
await sendOtpEmail(user.email, rawOtp)

res.status(201).json({
  message: 'Account created. A verification code has been sent to your email.',
  userId: user.id
  // No token yet — token is issued after email verification
})
```

---

### 3.3 — Modify `login` in `auth.controller.js`

After password validation passes, check `isVerified` before issuing token:

```javascript
// After isPasswordValid check — add this block:
if (!user.isVerified) {
  // Auto-resend OTP
  try {
    const rawOtp = await createOtp(user.id)
    await sendOtpEmail(user.email, rawOtp)
  } catch (err) {
    // Cooldown active — that's fine, don't fail the response
    console.log('[Auth] OTP resend skipped:', err.message)
  }

  return res.status(403).json({
    error: 'Email not verified. A new verification code has been sent.',
    userId: user.id
  })
}
```

---

### 3.4 — Modify `src/routes/auth.routes.js`

Add three new routes:

```javascript
const {
  register,
  login,
  getMe,
  sendOtp,
  verifyEmail,
  resendOtp
} = require('../controllers/auth.controller')

// Existing routes
router.post('/register', registerValidation, validate, register)
router.post('/login', loginValidation, validate, login)
router.get('/me', authenticate, getMe)

// New OTP routes
router.post('/send-otp', sendOtp)
router.post('/verify-otp', verifyEmail)
router.post('/resend-otp', resendOtp)
```

---

### 3.5 — Add OTP validation to `src/utils/validation.js`

Add these two validation rule sets:

```javascript
const verifyOtpValidation = [
  body('userId')
    .trim()
    .notEmpty().withMessage('userId is required.'),

  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required.')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.')
    .isNumeric().withMessage('OTP must contain numbers only.')
]

const resendOtpValidation = [
  body('userId')
    .trim()
    .notEmpty().withMessage('userId is required.')
]
```

Update `module.exports`:
```javascript
module.exports = {
  registerValidation,
  loginValidation,
  entryValidation,
  verifyOtpValidation,
  resendOtpValidation,
  validate
}
```

Update `auth.routes.js` to use them:
```javascript
router.post('/verify-otp', verifyOtpValidation, validate, verifyEmail)
router.post('/resend-otp', resendOtpValidation, validate, resendOtp)
```

---

### 3.6 — Update `prisma/seed.js`

The demo user must be pre-verified. Find the `prisma.user.create` call in the seed file and add `isVerified: true`:

```javascript
const user = await prisma.user.create({
  data: {
    email: CONFIG.demoUser.email,
    passwordHash,
    isVerified: true  // Add this line
  }
})
```

---

## Part 4 — New Frontend Files

### 4.1 — `src/pages/VerifyOtp.jsx`

**Route:** `/verify-otp`

**How user arrives here:**
- After register → redirected with `userId` in location state
- After login with unverified account → redirected with `userId` in location state

**Layout:** Same as Login page. Full screen centered. Max width 400px.

**Elements:**
- App name "MIRRORBLACK" top center
- Subtext: "A code was sent to your email." in muted white
- 6 individual single-character input boxes side by side (OTP input pattern)
- Auto-focus first box on mount
- Auto-advance to next box on character entry
- Auto-submit when all 6 digits entered
- Resend button below: "Resend code" — disabled with countdown timer (60s)
- Error message display inline
- Loading state on submit

**Behavior:**
- On mount: read `userId` from `location.state` — if missing redirect to `/register`
- On complete OTP entry: call `POST /api/auth/verify-otp` with `{ userId, otp }`
- On success: store JWT, set user in AuthContext, redirect to `/dashboard`
- On error: clear OTP inputs, show error, re-focus first input
- Resend button: calls `POST /api/auth/resend-otp` with `{ userId }` — shows countdown

**OTP Input behavior:**
- Backspace on empty input focuses previous input
- Paste support — paste 6 digits fills all boxes
- Numbers only — reject letters and special characters
- Each box: width 44px, height 52px, centered text, monospace font

---

### 4.2 — `src/api/auth.api.js`

Add these three functions to the existing auth API file:

```javascript
export const sendOtp = (email) =>
  api.post('/auth/send-otp', { email })

export const verifyOtp = (userId, otp) =>
  api.post('/auth/verify-otp', { userId, otp })

export const resendOtp = (userId) =>
  api.post('/auth/resend-otp', { userId })
```

---

## Part 5 — Modified Frontend Files

### 5.1 — Modify `src/pages/Register.jsx`

After successful registration the response contains `userId` not a `token`.

Change redirect behavior:

```javascript
// Before (old):
// setToken(data.token)
// navigate('/dashboard')

// After (new):
navigate('/verify-otp', {
  state: { userId: data.userId }
})
```

---

### 5.2 — Modify `src/pages/Login.jsx`

Handle `403` response from login (unverified account):

```javascript
// In the catch/error handling block:
if (error.response?.status === 403) {
  navigate('/verify-otp', {
    state: { userId: error.response.data.userId }
  })
  return
}
```

---

### 5.3 — Modify `src/App.jsx` — Add New Route

```jsx
import VerifyOtp from './pages/VerifyOtp'

// Add inside Routes, outside ProtectedRoute (public route):
<Route path="/verify-otp" element={<VerifyOtp />} />
```

---

## Part 6 — Auth Flow (Updated)

```
REGISTER:
User submits register form
→ POST /api/auth/register
→ Backend creates user (isVerified: false)
→ Backend generates OTP, hashes it, stores it
→ Backend sends OTP email via Brevo
→ Frontend receives { userId }
→ Frontend navigates to /verify-otp with userId in state

VERIFY OTP:
User enters 6-digit code
→ POST /api/auth/verify-otp { userId, otp }
→ Backend verifies OTP hash
→ Backend sets isVerified: true, clears OTP fields
→ Backend returns JWT + user
→ Frontend stores JWT, sets user in AuthContext
→ Frontend navigates to /dashboard

RESEND OTP:
User clicks "Resend code"
→ POST /api/auth/resend-otp { userId }
→ Backend checks 60s cooldown
→ If cooldown active: 429 with seconds remaining
→ If cooldown clear: generate new OTP, send email
→ Frontend shows success or cooldown error

LOGIN (unverified account):
User submits login form
→ POST /api/auth/login
→ Backend finds user, validates password
→ Backend checks isVerified — false
→ Backend auto-sends new OTP
→ Backend returns 403 { error, userId }
→ Frontend catches 403
→ Frontend navigates to /verify-otp with userId in state

LOGIN (verified account):
→ Normal flow — JWT returned immediately
```

---

## Part 7 — Postman Tests for Email Verification

### Test 1 — Register triggers OTP email
```
POST /api/auth/register
{ "email": "new@test.com", "password": "Test@1234" }
```
Expected: `201` with `userId`. No token. Check inbox for OTP email.

### Test 2 — Verify with correct OTP
```
POST /api/auth/verify-otp
{ "userId": "...", "otp": "123456" }
```
Expected: `200` with `token` and `user`.

### Test 3 — Verify with wrong OTP
```
POST /api/auth/verify-otp
{ "userId": "...", "otp": "000000" }
```
Expected: `400` with attempts remaining count.

### Test 4 — Verify with expired OTP
Wait 10 minutes or manually set `otpExpiresAt` to past in Supabase.
Expected: `400` "Verification code has expired."

### Test 5 — Max attempts lockout
Send 3 wrong OTPs in sequence.
Expected: 3rd attempt returns `400` "Maximum attempts reached."

### Test 6 — Resend cooldown
```
POST /api/auth/resend-otp twice within 60 seconds
```
Expected: 2nd request returns `429` with seconds remaining.

### Test 7 — Login with unverified account
```
POST /api/auth/login
{ "email": "unverified@test.com", "password": "Test@1234" }
```
Expected: `403` with `userId`. New OTP sent to email.

### Test 8 — Login with verified account
Expected: `200` with `token`. Normal flow.

### Test 9 — Seed user login (pre-verified)
```
POST /api/auth/login
{ "email": "demo@mirrorblack.com", "password": "Mirror@2024" }
```
Expected: `200` with token immediately — no OTP required.

---

## Common Pitfalls

| Problem | Fix |
|---------|-----|
| Brevo rejects emails | Verify sender email in Brevo dashboard under Senders & IP |
| SMTP auth fails | Brevo SMTP user is literally `"apikey"` — not your email |
| OTP never arrives | Check spam folder. Check Brevo logs under Email Activity |
| `otpAttempts` not incrementing | Ensure Prisma schema pushed and client regenerated |
| Seed user gets OTP on login | Confirm `isVerified: true` in seed script |
| Paste not working in OTP input | Implement `onPaste` handler that splits string across inputs |
| Resend countdown not resetting | Reset countdown state on successful resend response |
