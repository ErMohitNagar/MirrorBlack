# MIRRORBLACK — Integration & Testing Specification

## Agent Identity

You are a **senior full-stack engineer** with deep expertise in API integration, end-to-end testing, debugging, and production deployment. You verify everything. You trust nothing until it is tested. You write tests that expose real failure modes, not tests that confirm happy paths only.

---

## Overview

This document covers:
1. Backend API testing (Postman)
2. Frontend–backend integration verification
3. AI service integration testing
4. Edge case and failure mode testing
5. Pre-deployment checklist
6. Production smoke tests

---

## Part 1 — Backend API Tests (Postman)

Run all tests against `http://localhost:5000` in development.

### Setup: Postman Environment Variables

Create a Postman environment with these variables:

| Variable | Initial Value |
|----------|--------------|
| `base_url` | `http://localhost:5000` |
| `token` | (empty — populated by login test) |
| `entry_id` | (empty — populated by create entry test) |

---

### 1.1 — Health Check

```
GET {{base_url}}/health
```

**Expected:**
```json
{
  "status": "ok",
  "database": "connected",
  "environment": "development",
  "timestamp": "..."
}
```

**Fail condition:** `database: "disconnected"` means `DATABASE_URL` is wrong or Supabase is unreachable.

---

### 1.2 — Auth: Register

```
POST {{base_url}}/api/auth/register
Content-Type: application/json

{
  "email": "test@mirrorblack.com",
  "password": "Test@1234"
}
```

**Expected:** `201`
```json
{
  "message": "Account created successfully.",
  "token": "eyJ...",
  "user": { "id": "...", "email": "test@mirrorblack.com", "createdAt": "..." }
}
```

**Save token:** In Postman Tests tab:
```js
pm.environment.set('token', pm.response.json().token)
```

---

### 1.3 — Auth: Register Duplicate Email

```
POST {{base_url}}/api/auth/register
(same body as above)
```

**Expected:** `409`
```json
{ "error": "An account with this email already exists." }
```

---

### 1.4 — Auth: Register Invalid Input

```
POST {{base_url}}/api/auth/register

{
  "email": "notanemail",
  "password": "weak"
}
```

**Expected:** `400`
```json
{
  "error": "Validation failed.",
  "details": [...]
}
```

---

### 1.5 — Auth: Login

```
POST {{base_url}}/api/auth/login

{
  "email": "test@mirrorblack.com",
  "password": "Test@1234"
}
```

**Expected:** `200` with token.

**Save token:** Same Postman Tests script as 1.2.

---

### 1.6 — Auth: Login Wrong Password

```
POST {{base_url}}/api/auth/login

{
  "email": "test@mirrorblack.com",
  "password": "WrongPassword@1"
}
```

**Expected:** `401`
```json
{ "error": "Invalid credentials." }
```

**Verify timing attack prevention:** Both wrong email and wrong password should return the same response in approximately the same time (both ~100–300ms due to bcrypt).

---

### 1.7 — Auth: Get Me

```
GET {{base_url}}/api/auth/me
Authorization: Bearer {{token}}
```

**Expected:** `200`
```json
{
  "user": { "id": "...", "email": "...", "createdAt": "..." }
}
```

---

### 1.8 — Auth: Get Me Without Token

```
GET {{base_url}}/api/auth/me
(no Authorization header)
```

**Expected:** `401`
```json
{ "error": "Access denied. No token provided." }
```

---

### 1.9 — Entries: Create

```
POST {{base_url}}/api/entries
Authorization: Bearer {{token}}

{
  "content": "I have been thinking about starting my own business for the past six months. Every time I sit down to plan it, I get overwhelmed by the details and close my laptop."
}
```

**Expected:** `201`
```json
{
  "entry": {
    "id": "...",
    "content": "...",
    "isLocked": false,
    "createdAt": "...",
    "userId": "..."
  }
}
```

**Save entry ID:**
```js
pm.environment.set('entry_id', pm.response.json().entry.id)
```

**Wait 5–10 seconds**, then fetch the entry — embedding and tags should be generated in background.

---

### 1.10 — Entries: Create Too Short

```
POST {{base_url}}/api/entries
Authorization: Bearer {{token}}

{ "content": "short" }
```

**Expected:** `400` validation error.

---

### 1.11 — Entries: Create Without Auth

```
POST {{base_url}}/api/entries
(no token)

{ "content": "This should fail." }
```

**Expected:** `401`

---

### 1.12 — Entries: List

```
GET {{base_url}}/api/entries
Authorization: Bearer {{token}}
```

**Expected:** `200`
```json
{
  "entries": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 1.13 — Entries: List Paginated

```
GET {{base_url}}/api/entries?page=1&limit=5
Authorization: Bearer {{token}}
```

**Expected:** `200` with pagination metadata correctly reflecting limit.

---

### 1.14 — Entries: Get Single

```
GET {{base_url}}/api/entries/{{entry_id}}
Authorization: Bearer {{token}}
```

**Expected:** `200` with entry, tags, and reflection (if generated).

---

### 1.15 — Entries: Update

```
PATCH {{base_url}}/api/entries/{{entry_id}}
Authorization: Bearer {{token}}

{
  "content": "I have been thinking about starting my own business for the past six months. Every time I sit down to plan it, I get overwhelmed and walk away. This has happened at least twelve times."
}
```

**Expected:** `200` with updated entry.

---

### 1.16 — Entries: Update Someone Else's Entry

1. Register a second account, get its token
2. Try to update `entry_id` with the second account's token

**Expected:** `403` or `404`

---

### 1.17 — Entries: Delete

```
DELETE {{base_url}}/api/entries/{{entry_id}}
Authorization: Bearer {{token}}
```

**Expected:** `204` no content.

**Verify:** Fetch the entry again — should return `404`.

---

### 1.18 — Reflection: Generate

Create a new entry first (save its ID as `entry_id`), then:

```
POST {{base_url}}/api/reflect/{{entry_id}}
Authorization: Bearer {{token}}
```

**Expected:** `201`
```json
{
  "reflection": {
    "id": "...",
    "content": "...",
    "question": "...",
    "entryId": "...",
    "userId": "...",
    "createdAt": "..."
  }
}
```

**Verify AI behavior:**
- `content` must not contain: good, great, proud, amazing, understandable, valid, normal, okay, growth, journey, healing
- `question` must be a single question (ends with `?`)
- `content` must be under 250 words
- No exclamation marks in either field

---

### 1.19 — Reflection: Generate Duplicate

```
POST {{base_url}}/api/reflect/{{entry_id}}
(same entry as above)
```

**Expected:** `409` — reflection already exists for this entry.

---

### 1.20 — Reflection: Get

```
GET {{base_url}}/api/reflect/{{entry_id}}
Authorization: Bearer {{token}}
```

**Expected:** `200` with reflection.

---

### 1.21 — Rate Limit Test

Send 11 requests to `POST /api/auth/login` in rapid succession.

**Expected:** 11th request returns `429`
```json
{ "error": "Too many authentication attempts. Please try again later." }
```

---

## Part 2 — AI Integration Tests

These verify the AI services work correctly in isolation.

### 2.1 — Embedding Generation

Write a quick test script `test/embedding.test.js`:

```js
require('dotenv').config()
const { generateEmbedding } = require('../src/services/ai.service')

async function test() {
  const text = "I keep telling myself I will start tomorrow."
  const embedding = await generateEmbedding(text)

  console.log('Embedding dimensions:', embedding.length) // Should be 384
  console.log('First 5 values:', embedding.slice(0, 5))
  console.log('All values are numbers:', embedding.every(v => typeof v === 'number'))
}

test().catch(console.error)
```

Run: `node test/embedding.test.js`

**Expected:** 384-dimension array of numbers.

---

### 2.2 — Classification Test

```js
require('dotenv').config()
const { classifyEntry } = require('../src/services/ai.service')

async function test() {
  const content = `I want to start a business but I'm afraid of failing. 
  I told myself last year I would do it. I never did. 
  I believe I'm not smart enough for it.`

  const tags = await classifyEntry(content)
  console.log('Tags:', JSON.stringify(tags, null, 2))
}

test().catch(console.error)
```

**Expected:** Array with INTENT, FEAR, and BELIEF tags. No OUTCOME (nothing was completed).

---

### 2.3 — Reflection Tone Test

After generating 3–5 entries and their reflections manually via Postman, verify:

**Forbidden words check:** Search reflection content for:
`good, great, proud, amazing, understandable, valid, normal, okay, growth, journey, healing, "it sounds like", "it seems like", "I can see that"`

None should appear.

**Question quality check:**
- Is it specific to the entry content? (Not generic)
- Does it end with `?`
- Is it one sentence?
- Is it uncomfortable without being cruel?

---

### 2.4 — Vector Similarity Test

1. Create 5 entries about the same theme (e.g., procrastination)
2. Create 1 entry about a different theme (e.g., a specific conversation)
3. Generate a new entry about procrastination
4. Call `POST /api/reflect/{{new_entry_id}}`
5. Check the reflection — it should reference patterns from the similar entries

---

## Part 3 — Frontend Integration Tests

Run these after connecting frontend to backend.

### 3.1 — Auth Flow

1. Open app — verify redirect to `/login`
2. Register new account — verify redirect to `/dashboard`
3. Refresh page — verify still logged in (token persisted)
4. Logout — verify redirect to `/login`
5. Navigate to `/dashboard` while logged out — verify redirect to `/login`
6. Login with wrong password — verify error message appears inline (not alert)

---

### 3.2 — Entry Creation Flow

1. Click "New entry"
2. Type less than 10 characters — verify submit button disabled
3. Type valid entry (150+ chars)
4. Submit — verify "Analyzing..." text appears
5. Verify redirect to entry detail page
6. Verify reflection appears on entry detail
7. Verify tags appear under entry

---

### 3.3 — Entry Edit Flow

1. Open entry less than 24 hours old
2. Click edit — verify textarea appears with current content
3. Edit and save — verify updated content shows
4. Verify reflection is regenerated in background

---

### 3.4 — Lock Flow

This requires either:
- Manually setting `isLocked = true` in Supabase
- Waiting 24 hours (not practical for testing)
- Temporarily changing the lock check to 1 minute for testing

Verify locked entry shows "Locked" indicator and edit button is hidden.

---

### 3.5 — Mobile Responsiveness

Test on these viewports (use Chrome DevTools):
- 375px — iPhone SE
- 390px — iPhone 14
- 414px — iPhone Plus
- 768px — iPad

**Check each page:**
- [ ] No horizontal scroll
- [ ] All text readable (no overflow)
- [ ] Buttons tappable (min 44px height)
- [ ] Textarea fills available space on `/entries/new`
- [ ] "New entry" button visible and accessible
- [ ] Navigation readable

---

### 3.6 — Network Error Handling

1. Stop the backend server
2. Try to login from frontend
3. Verify error message: "Unable to connect. Check your connection."
4. Restart backend — verify app recovers

---

### 3.7 — 401 Handling

1. Manually corrupt the token in localStorage (`mb_token`)
2. Try to access `/dashboard`
3. Verify automatic redirect to `/login`

---

## Part 4 — Edge Cases

### 4.1 — Very Long Entry

Create an entry with exactly 10,000 characters.
**Expected:** Success.

Create an entry with 10,001 characters.
**Expected:** `400` validation error.

---

### 4.2 — Special Characters in Entry

Create an entry with: `"`, `'`, `<script>alert('xss')</script>`, `\n\n`, unicode characters.
**Expected:** Entry saves and displays correctly. No XSS. No SQL injection.

---

### 4.3 — Concurrent Requests

Submit the new entry form twice in rapid succession (double-click).
**Expected:** Only one entry created. (Handle with button disable on submit)

---

### 4.4 — Reflection for Entry Without Embedding

Create an entry and immediately request a reflection before the background embedding job completes.
**Expected:** Reflection generates using text context only (no vector search). Does not fail.

---

### 4.5 — Empty Entry List Reflection

Request a reflection for a user's very first entry (no previous entries).
**Expected:** Reflection generates. Content acknowledges it's the first entry without pattern analysis. Still asks a question.

---

### 4.6 — Invalid UUID in Route

```
GET {{base_url}}/api/entries/not-a-valid-uuid
Authorization: Bearer {{token}}
```

**Expected:** `404` or `400` — not a 500 crash.

---

## Part 5 — Pre-Deployment Checklist

### Backend (Render)

- [ ] All environment variables set in Render dashboard
- [ ] `NODE_ENV=production` set
- [ ] `CLIENT_URL` set to production Vercel URL
- [ ] Build command: `npm install && npx prisma generate`
- [ ] Start command: `node src/server.js`
- [ ] Health check URL configured: `/health`
- [ ] `npx prisma db push` run against production Supabase

### Frontend (Vercel)

- [ ] `VITE_API_URL` set to production Render backend URL
- [ ] `vercel.json` present with SPA rewrite rule
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] No `localhost` URLs anywhere in source code

### Database (Supabase)

- [ ] pgvector extension enabled
- [ ] All 4 tables exist: User, Entry, EntryTag, Reflection
- [ ] Connection string uses pooled connection URL for production

---

## Part 6 — Production Smoke Tests

Run these immediately after deployment.

### 6.1 — Health Check
```
GET https://your-backend.onrender.com/health
```
**Expected:** `database: "connected"`

### 6.2 — CORS Verification
Open browser console on your Vercel frontend URL.
Make a login request.
**Expected:** No CORS errors in console.

### 6.3 — Full Flow
1. Register new account on production
2. Create entry
3. Generate reflection
4. Verify reflection appears
5. Logout and login again
6. Verify entries persist

### 6.4 — Mobile Production Test
Open production URL on actual mobile device.
Verify all pages are usable with touch.

---

## Common Integration Bugs

| Bug | Cause | Fix |
|-----|-------|-----|
| CORS error in browser | `CLIENT_URL` doesn't match frontend URL exactly | Update env var — trailing slash matters |
| 401 on every request | Token not being sent | Check Axios interceptor is attached |
| Reflection times out | OpenRouter free tier rate limiting | Add retry logic — already in `withRetry` |
| Embedding column won't update | Using Prisma update instead of `$executeRaw` | Unsupported types require raw SQL |
| Tags not appearing | Background job silent failure | Check server logs for `[Background]` errors |
| App shows blank on refresh | SPA routing not configured on Vercel | Add `vercel.json` with rewrite rule |
| 500 on reflection | AI response not valid JSON | Check `parseReflectionResponse` — tighten system prompt |
| Mobile textarea overflow | Missing `h-full` or `min-h-0` | Review flexbox constraints on textarea container |
