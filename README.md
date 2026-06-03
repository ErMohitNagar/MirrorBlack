# 🪞 MirrorBlack

**MirrorBlack** is an AI-powered self-reflection journal that helps you uncover hidden patterns in your thinking. Write freely, and let the AI surface the intents, beliefs, fears, and outcomes embedded in your entries — then reflect deeper with AI-guided questions.

---

## ✨ Features

- **Journaling with AI tagging** — Entries are automatically analyzed and tagged with cognitive categories: `INTENT`, `BELIEF`, `FEAR`, `OUTCOME`
- **Semantic search** — Find past entries by meaning, not just keywords, powered by Voyage AI embeddings and pgvector
- **AI-guided reflections** — Receive thought-provoking questions generated from your entries to drive deeper self-awareness
- **Email verification** — Secure OTP-based email verification via Brevo SMTP
- **Entry locking** — Lock finalized entries to preserve your authentic record
- **Rate-limited & hardened** — Helmet, HPP, compression, and layered rate limiting out of the box

---

## 🛠 Tech Stack

| Layer      | Technology                                                    |
| ---------- | ------------------------------------------------------------- |
| Frontend   | React 19, Vite, Tailwind CSS, React Router v7, React Hook Form |
| Backend    | Node.js, Express 5, Prisma ORM                               |
| Database   | PostgreSQL (Supabase) with pgvector extension                 |
| AI         | OpenRouter (Gemma 4 31B), Voyage AI (embeddings)              |
| Email      | Brevo (Sendinblue) SMTP                                       |
| Deployment | Vercel (frontend)                                             |

---

## 📁 Project Structure

```
MirrorBlack/
├── mirrorblack-backend/        # Express API server
│   ├── prisma/
│   │   └── schema.prisma       # Database schema (User, Entry, EntryTag, Reflection)
│   ├── src/
│   │   ├── config/             # Database client config
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # Auth, error handling, validation
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # AI, embedding, and email services
│   │   ├── utils/              # Helpers and utilities
│   │   └── server.js           # App entry point
│   ├── test/                   # Test files
│   ├── .env.example
│   └── package.json
│
├── mirrorblack-frontend/       # React SPA
│   ├── public/
│   ├── src/
│   │   ├── api/                # Axios API client
│   │   ├── assets/             # Static assets
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # React context providers
│   │   ├── hooks/              # Custom hooks
│   │   ├── pages/              # Route pages (Dashboard, Login, Register, etc.)
│   │   ├── utils/              # Frontend utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** database with the `pgvector` extension enabled (or a Supabase project)
- **API keys** for OpenRouter and Voyage AI
- **Brevo account** for transactional emails

### 1. Clone the repository

```bash
git clone https://github.com/your-username/MirrorBlack.git
cd MirrorBlack
```

### 2. Set up the backend

```bash
cd mirrorblack-backend
npm install
```

Create a `.env` file based on `.env.example` and fill in your credentials:

```env
# Database
DATABASE_URL="postgresql://..."

# Server
PORT=5000
NODE_ENV=development

# Frontend
CLIENT_URL=http://localhost:5173

# Auth
JWT_SECRET=your-secret-key-minimum-32-characters

# OpenRouter (AI reflections & tagging)
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=google/gemma-4-31b-it:free

# Voyage AI (semantic embeddings)
VOYAGE_API_KEY=your-voyage-key

# Brevo SMTP (email verification)
BREVO_API_KEY=your-brevo-key
BREVO_SENDER_EMAIL=your-email@example.com
BREVO_SENDER_NAME=MIRRORBLACK
```

Generate the Prisma client and run migrations:

```bash
npx prisma generate
npx prisma db push
```

Start the dev server:

```bash
npm run dev
```

The API will be available at `http://localhost:5000`.

### 3. Set up the frontend

```bash
cd mirrorblack-frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📡 API Routes

### Auth (`/api/auth`)

| Method | Endpoint     | Description              |
| ------ | ------------ | ------------------------ |
| POST   | `/register`  | Create a new account     |
| POST   | `/verify`    | Verify OTP code          |
| POST   | `/login`     | Log in and receive JWT   |

### Entries (`/api/entries`)

| Method | Endpoint    | Description                            |
| ------ | ----------- | -------------------------------------- |
| GET    | `/`         | List all entries for the current user  |
| POST   | `/`         | Create a new journal entry             |
| GET    | `/:id`      | Get a specific entry with tags         |
| PATCH  | `/:id/lock` | Lock an entry                          |

### Reflections (`/api/reflect`)

| Method | Endpoint    | Description                             |
| ------ | ----------- | --------------------------------------- |
| POST   | `/:entryId` | Generate an AI reflection for an entry  |

---

## 🗃 Database Models

- **User** — Account with email/password auth, OTP verification
- **Entry** — Journal entries with optional vector embeddings for semantic search
- **EntryTag** — AI-generated tags categorized as `INTENT`, `BELIEF`, `FEAR`, or `OUTCOME`
- **Reflection** — AI-generated reflection questions and responses tied to entries

---

## 📄 License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).
