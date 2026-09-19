# Velvet Health — Backend API

Node.js + Express + TypeScript + Prisma backend for the Velvet Health first-aid
training platform. Replaces the legacy PHP/MySQL implementation.

## Stack

- **Runtime:** Node.js (>= 18)
- **Language:** TypeScript
- **Web framework:** Express
- **ORM:** Prisma (`provider = "postgresql"`)
- **Auth:** JWT (`jsonwebtoken`) + `bcrypt` password hashing
- **Validation:** `zod`
- **Tooling:** `tsx` (dev runner), `cors`, `dotenv`, `helmet`

## Prerequisites

- Node.js >= 18 and npm
- A reachable PostgreSQL instance

## Setup

```bash
cd server
npm install

# Create your environment file from the template
cp .env.example .env
# Edit .env: set DATABASE_URL and a strong JWT_SECRET
```

`.env` is gitignored. `.env.example` is committed with placeholder values.

## Database

```bash
# Apply the initial migration (creates the tables)
npx prisma migrate dev --name init

# Seed 3 courses (RCP, Hemorragias, Heimlich) with 5 questions each
npx prisma db seed
```

## Running

```bash
# Development (watch mode, tsx)
npm run dev

# Production build + start
npm run build
npm start
```

The API listens on `http://localhost:3001` (override with `PORT`).

## Offline verification (no database required)

```bash
npx prisma validate    # validates schema.prisma
npx prisma generate    # generates the Prisma client
npx tsc --noEmit       # full TypeScript typecheck
```

## Endpoints

| Method | Path                          | Auth | Description                                    |
| ------ | ----------------------------- | ---- | ---------------------------------------------- |
| POST   | `/api/auth/register`          | no   | Create a user (201)                            |
| POST   | `/api/auth/login`             | no   | Return a JWT + user (200)                      |
| POST   | `/api/auth/logout`            | no   | Stateless logout (204)                         |
| GET    | `/api/auth/me`                | yes  | Current user (200)                             |
| GET    | `/api/courses`                | no   | List courses (200)                             |
| GET    | `/api/courses/:slug`          | no   | Course detail with instructions (200)          |
| GET    | `/api/courses/:slug/exam`     | no   | Exam questions without answers (200)           |
| POST   | `/api/courses/:slug/exam/submit` | yes | Grade exam, persist result (200)            |
| GET    | `/api/me/results`             | yes  | Current user's exam results (200)              |
| GET    | `/api/users`                  | yes  | List users (200)                               |

Authentication uses a bearer token: `Authorization: Bearer <token>`.

### Error format

Every non-2xx response returns:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "human-readable message" } }
```

| Status | Code             |
| ------ | ---------------- |
| 400    | `VALIDATION_ERROR` |
| 401    | `UNAUTHORIZED`   |
| 404    | `NOT_FOUND`      |
| 409    | `CONFLICT`       |
| 500    | `INTERNAL_ERROR` |

## Security notes

- Passwords are hashed with `bcrypt` and never returned by the API.
- `GET /api/courses/:slug/exam` never exposes `isCorrect`; grading is server-side
  on submit, which returns only `{ score, passed, resultId }`.
- The exam `submit` endpoint requires a JWT because `ExamResult.userId` is
  non-nullable — a result must belong to an authenticated user.
