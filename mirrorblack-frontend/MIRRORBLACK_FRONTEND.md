# MIRRORBLACK — Frontend Agent Specification

## Agent Identity

You are a **senior full-stack engineer and UI/UX designer** with deep expertise in React, Tailwind CSS, responsive design, accessibility, state management, and API integration. You write production-grade frontend code. You never use placeholder UI. You never leave TODO comments. You build complete, functional, visually intentional interfaces.

---

## Project Overview

**MIRRORBLACK** is a psychological reflection web app. It surfaces behavioral patterns, contradictions, and avoidance in a user's journal entries. The UI must reflect the product's philosophy:

- No comfort
- No color-coded moods
- No motivational language
- No emojis
- No dashboards
- No analytics
- Brutal clarity. Dark. Still. Precise.

---

## Tech Stack (Locked)

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 |
| HTTP | Axios |
| State | React Context + useReducer |
| Auth State | JWT stored in localStorage |
| Forms | React Hook Form |
| Date formatting | date-fns |

---

## Design Philosophy

### Aesthetic Direction: **Brutalist Minimal Dark**

- Background: near-black (`#0a0a0a`)
- Text: off-white (`#e8e8e8`)
- Accent: a single cold color — slate or steel blue (`#4a6fa5`) for interactive elements only
- No gradients
- No shadows
- No rounded corners except subtle `rounded-sm` on inputs
- No card hover effects
- Typography: monospace or a sharp serif for body text — never Inter, Roboto, or system fonts
- Spacing is generous — content breathes
- Every page feels like looking into a mirror in a dark room

### Font Recommendation
- Display/headings: `DM Serif Display` or `Playfair Display`
- Body/entries: `JetBrains Mono` or `IBM Plex Mono`
- Import from Google Fonts in `index.html`

### What the UI must never do
- Never use green, yellow, or red for emotional indicators
- Never show streaks, scores, or progress bars
- Never show motivational copy ("Keep going!", "Great job!")
- Never use emojis anywhere
- Never use rounded pill buttons
- Never use card shadows or glassmorphism

---

## Project Structure

```
mirrorblack-frontend/
├── public/
│   └── index.html
├── src/
│   ├── api/
│   │   ├── axios.js           — Axios instance with base URL + auth header
│   │   ├── auth.api.js        — register, login, getMe
│   │   ├── entries.api.js     — createEntry, getEntries, getEntry, updateEntry, deleteEntry
│   │   └── reflections.api.js — createReflection, getReflection
│   ├── context/
│   │   └── AuthContext.jsx    — Auth state, login, logout, user
│   ├── hooks/
│   │   ├── useAuth.js         — Consume AuthContext
│   │   └── useEntries.js      — Entry CRUD with loading/error states
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx      — Entry list
│   │   ├── NewEntry.jsx       — Write new entry
│   │   ├── EntryDetail.jsx    — View entry + tags + reflection
│   │   └── NotFound.jsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx  — Wrapper with nav
│   │   │   └── Navbar.jsx
│   │   ├── entry/
│   │   │   ├── EntryCard.jsx
│   │   │   ├── EntryEditor.jsx
│   │   │   └── EntryTag.jsx
│   │   ├── reflection/
│   │   │   └── ReflectionBlock.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Textarea.jsx
│   │       ├── ErrorMessage.jsx
│   │       ├── LoadingSpinner.jsx
│   │       └── ProtectedRoute.jsx
│   ├── utils/
│   │   ├── formatDate.js
│   │   └── tokenStorage.js    — get/set/remove JWT from localStorage
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── .env.example
├── tailwind.config.js
└── package.json
```

---

## Environment Variables

```env
VITE_API_URL=http://localhost:5000/api
```

For production:
```env
VITE_API_URL=https://your-render-backend.onrender.com/api
```

---

## Tailwind Configuration

`tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        black: {
          DEFAULT: '#0a0a0a',
          soft: '#111111',
          border: '#1e1e1e',
        },
        white: {
          DEFAULT: '#e8e8e8',
          muted: '#888888',
          faint: '#444444',
        },
        accent: {
          DEFAULT: '#4a6fa5',
          hover: '#3a5f95',
        }
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

---

## Pages — Complete Specification

### `/login` — Login Page

**Layout:** Full screen, centered, single column. Max width 400px on desktop, full width on mobile with horizontal padding.

**Elements:**
- App name "MIRRORBLACK" in display font, large, top center
- Tagline: "It does not comfort. It reflects." in muted white, small
- Email input
- Password input with show/hide toggle
- Login button (full width)
- Link: "No account. Create one." — routes to `/register`
- Error message display (server errors and validation)

**Behavior:**
- On submit: call `POST /api/auth/login`
- On success: store JWT, redirect to `/dashboard`
- On error: display server error message inline
- Loading state: disable button, show spinner inside button

---

### `/register` — Register Page

**Layout:** Same as login page.

**Elements:**
- App name + tagline
- Email input
- Password input with show/hide toggle
- Password requirements display (show as user types — 8+ chars, uppercase, number, special char)
- Register button (full width)
- Link: "Already here. Sign in." — routes to `/login`

**Behavior:**
- Client-side validation before submit
- On success: store JWT, redirect to `/dashboard`
- Password requirements update visually as user types (green checkmark → use a neutral indicator, NOT green. Use a dim/bright white toggle instead.)

---

### `/dashboard` — Entry List

**Layout:** Single column, max width 680px, centered. On mobile: full width with padding.

**Header:**
- App name top left (small)
- Logout button top right (text only, no border)

**Entry List:**
- Entries ordered newest first
- Each entry shows:
  - Date (formatted: "June 3, 2026")
  - First 120 characters of content with ellipsis
  - Tags as small monospace labels (INTENT, FEAR, BELIEF, OUTCOME) — no colors, just dim borders
  - Lock indicator if `isLocked = true` (small padlock icon or text "locked")
- Empty state: "No entries." — nothing more. No illustration. No call to action beyond the write button.

**Write Button:**
- Fixed bottom right on mobile
- Inline top right on desktop
- Text: "New entry" — no icon required
- Sharp rectangle, no rounding

**Pagination:**
- Simple "Load more" button at bottom — no numbered pagination
- Show total entry count: "47 entries"

---

### `/entries/new` — New Entry

**Layout:** Full screen writing experience. Distraction-free.

**Elements:**
- Back arrow top left
- Date display top right (today's date, auto-generated)
- Full-width textarea — no border, no background, just text on dark. Monospace font. Large enough to read comfortably.
- Character count bottom right (e.g. "342 / 10000")
- Submit button bottom: "Submit" — after submit it becomes "Submitted" briefly then redirects

**Behavior:**
- Minimum 10 characters to enable submit
- On submit: call `POST /api/entries`
- After success: immediately call `POST /api/reflect/:entryId` to trigger reflection
- Redirect to `/entries/:id` to show the entry + reflection
- Show loading state during reflection generation — this can take 3–8 seconds. Show a single line of text: "Analyzing..." — not a spinner. Not a progress bar. Static text.

---

### `/entries/:id` — Entry Detail

**Layout:** Single column, max width 680px.

**Sections:**

**Entry Header:**
- Date
- Lock status ("Locked" in muted text if `isLocked = true`)
- Edit button (only if not locked) — routes to edit mode inline
- Delete button (text only, far right) — confirm before delete

**Entry Content:**
- Full entry text in monospace font
- Generous line height

**Tags Section:**
- Heading: "Detected" in small muted caps
- Tags displayed as inline labels: `INTENT fear of starting` etc.
- No color coding — all same dim style

**Reflection Section:**
- Horizontal rule separator
- Heading: "MIRRORBLACK" in small display font caps
- Reflection content in regular text
- Final question displayed separately — slightly larger, italic, full width
- If no reflection yet: show "No reflection generated." with a button "Generate reflection"

**Edit Mode (inline):**
- Replace content with editable textarea
- Save and Cancel buttons
- Only available if not locked

---

### `404` — Not Found

- Single line: "This does not exist."
- Link back to dashboard

---

## Components — Complete Specification

### `src/api/axios.js`

```js
import axios from 'axios'
import { getToken } from '../utils/tokenStorage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally — log out user
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mb_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

---

### `src/utils/tokenStorage.js`

```js
const KEY = 'mb_token'

export const getToken = () => localStorage.getItem(KEY)
export const setToken = (token) => localStorage.setItem(KEY, token)
export const removeToken = () => localStorage.removeItem(KEY)
```

---

### `src/context/AuthContext.jsx`

- Provides: `user`, `token`, `login(token, user)`, `logout()`, `isLoading`, `isAuthenticated`
- On mount: if token exists in localStorage, call `GET /api/auth/me` to restore session
- If `/me` fails: clear token and set unauthenticated
- `login()`: stores token, sets user in state
- `logout()`: removes token, clears user, redirects to `/login`

---

### `src/components/ui/ProtectedRoute.jsx`

- If `isLoading`: show full-screen loading state (single centered "." or nothing)
- If `!isAuthenticated`: redirect to `/login`
- Otherwise: render children

---

### `src/hooks/useEntries.js`

Expose:
- `entries` — array
- `pagination` — object
- `loading` — boolean
- `error` — string or null
- `fetchEntries(page)` — load entries
- `loadMore()` — append next page
- `createEntry(content)` — create + return entry
- `updateEntry(id, content)` — update + return entry
- `deleteEntry(id)` — delete + remove from state

---

## Mobile Responsiveness

Every page must work on screens as small as 375px (iPhone SE).

Rules:
- No horizontal scroll ever
- Touch targets minimum 44px height
- Textarea on new entry page must fill viewport height minus header on mobile
- Fixed "New entry" button on mobile (bottom right, `fixed bottom-6 right-6`)
- Navbar collapses to just the app name + logout icon on mobile
- Entry list cards full width on mobile
- Font sizes scale down on mobile — use `text-sm` on mobile, `text-base` on desktop via responsive classes

---

## Loading and Error States

Every API call must handle three states:

| State | Display |
|-------|---------|
| Loading | Inline text or disabled button — never full page spinners except initial load |
| Error | Inline error message in muted red (`#8b2020`) — never alert() |
| Empty | Single line of text — no illustrations |

---

## Auth Flow

```
App loads
  → Check localStorage for token
  → If token: call GET /api/auth/me
    → Success: set user, show app
    → Fail: clear token, redirect /login
  → If no token: redirect /login

Login/Register
  → Success: setToken(token), setUser(user)
  → Redirect to /dashboard

Any 401 response
  → Clear token
  → Redirect /login
```

---

## Route Structure

```jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />

  <Route element={<ProtectedRoute />}>
    <Route element={<AppLayout />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/entries/new" element={<NewEntry />} />
      <Route path="/entries/:id" element={<EntryDetail />} />
    </Route>
  </Route>

  <Route path="/" element={<Navigate to="/dashboard" />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

---

## Entry Detail Flow (Critical)

When a new entry is submitted:

1. `POST /api/entries` — create entry → get back `entry.id`
2. `POST /api/reflect/:entryId` — trigger reflection generation
3. Show "Analyzing..." text while step 2 is pending
4. On reflection success: navigate to `/entries/:id`
5. On reflection failure: still navigate to `/entries/:id` — show "No reflection generated." with retry button

Never block navigation on reflection failure.

---

## Error Message Standards

- Server errors: display `error.response?.data?.error || 'Something went wrong.'`
- Network errors: display `'Unable to connect. Check your connection.'`
- Validation errors: display per-field under each input
- Never show raw error objects or stack traces

---

## Deployment (Vercel)

- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` in Vercel environment variables
- Add `vercel.json` for SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Install Commands

```bash
npm create vite@latest mirrorblack-frontend -- --template react
cd mirrorblack-frontend
npm install
npm install axios react-router-dom react-hook-form date-fns
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## What This UI Is Not

Do not add:
- Dark/light mode toggle
- Notification bell
- Profile page with avatar
- Mood tracker
- Stats or charts
- Tags filter UI
- Search bar
- Export button
- Social sharing

These are not in scope. The UI exists for one purpose: write, submit, receive reflection.
