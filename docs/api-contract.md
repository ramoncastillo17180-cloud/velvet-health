# Velvet Health — API Contract (v1)

Frozen contract between the React frontend and the Express backend. Both agents
implement against this exact spec. **Do not change this file during Phase 4
without coordinating with the other agent and the orchestrator.**

## Base URL

| Environment | URL |
| --- | --- |
| Development | `http://localhost:3001/api` |
| Production | `https://<server>.onrender.com/api` |

## Authentication

- JWT bearer token: `Authorization: Bearer <token>`.
- Passwords are hashed with **bcrypt** and never returned by the API.

## Error format

Every non-2xx response returns:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "human-readable message"
  }
}
```

Status codes:

| Code | Meaning |
| --- | --- |
| `400` | Validation / malformed body |
| `401` | Missing or invalid token |
| `404` | Resource not found |
| `409` | Conflict (e.g. email already registered) |
| `500` | Server error |

## Endpoints

### Auth

#### `POST /api/auth/register`
Request body:
```json
{
  "nombre": "string (required)",
  "apellidos": "string (required)",
  "profesion": "string | null",
  "edad": "number | null",
  "correo": "string (required, unique)",
  "contraseña": "string (required, min 8)"
}
```
Response `201`:
```json
{ "user": { "id": 1, "nombre": "...", "apellidos": "...", "profesion": null, "edad": null, "correo": "...", "createdAt": "ISO" } }
```

#### `POST /api/auth/login`
Request body:
```json
{ "correo": "string", "contraseña": "string" }
```
Response `200`:
```json
{ "token": "jwt", "user": { "id": 1, "nombre": "...", "correo": "..." } }
```

#### `POST /api/auth/logout`
Response `204` (stateless; client discards the token).

#### `GET /api/auth/me`
Header: `Authorization: Bearer <token>`. Response `200`:
```json
{ "user": { "id": 1, "nombre": "...", "correo": "..." } }
```

### Courses

#### `GET /api/courses`
Response `200`:
```json
{
  "courses": [
    { "id": 1, "slug": "rcp", "title": "Reanimación Cardiopulmonar", "description": "...", "minutes": 20, "image": "reanimacion.png", "passThreshold": 70 },
    { "id": 2, "slug": "hemorragias", "title": "Hemorragias Externas", "minutes": 60, "image": "hemorragia.png", "passThreshold": 70 },
    { "id": 3, "slug": "heimlich", "title": "Maniobra de Heimlich", "minutes": 15, "image": "heimich.png", "passThreshold": 70 }
  ]
}
```

#### `GET /api/courses/:slug`
Response `200`:
```json
{
  "course": {
    "id": 1,
    "slug": "rcp",
    "title": "Reanimación Cardiopulmonar",
    "description": "...",
    "minutes": 20,
    "image": "reanimacion.png",
    "passThreshold": 70,
    "instructions": [ "..." ]
  }
}
```

### Exam

#### `GET /api/courses/:slug/exam`
Returns questions **without** the correct-answer flag (grading is server-side).
Response `200`:
```json
{
  "exam": {
    "courseId": 1,
    "questions": [
      {
        "id": 1,
        "prompt": "...",
        "options": [
          { "id": 1, "text": "..." },
          { "id": 2, "text": "..." }
        ]
      }
    ]
  }
}
```

#### `POST /api/courses/:slug/exam/submit`
Request body:
```json
{ "answers": [ { "questionId": 1, "optionId": 2 } ] }
```
Response `200`:
```json
{ "score": 80, "passed": true, "resultId": 42 }
```

### Results

#### `GET /api/me/results`
Header: `Authorization: Bearer <token>`. Response `200`:
```json
{
  "results": [
    { "id": 42, "courseId": 1, "courseSlug": "rcp", "score": 80, "passed": true, "createdAt": "ISO" }
  ]
}
```

### Users (protected)

#### `GET /api/users`
Response `200`:
```json
{ "users": [ { "id": 1, "nombre": "...", "apellidos": "...", "profesion": null, "edad": null, "correo": "..." } ] }
```

## Data shapes (shared)

```ts
type User = { id: number; nombre: string; apellidos: string; profesion: string | null; edad: number | null; correo: string; createdAt: string }
type Course = { id: number; slug: string; title: string; description: string; minutes: number; image: string; passThreshold: number }
type Question = { id: number; prompt: string; options: { id: number; text: string }[] }
type ExamResult = { id: number; courseId: number; courseSlug: string; score: number; passed: boolean; createdAt: string }
```

## Conventions

- JSON keys are `camelCase`.
- IDs are integers (Prisma autoincrement).
- Course `slug` values are fixed: `rcp`, `hemorragias`, `heimlich`.
- The frontend must never receive the correct-answer flag (`isCorrect`).

---

# API Contract v2 (additive)

> Phase 2 (auth + RBAC + password reset). Every v1 endpoint shape above remains
> byte-compatible; `role` is the only field added to existing user payloads.

## Roles

`role` is one of `STUDENT | INSTRUCTOR | ADMIN`. Registration always creates a
`STUDENT`; any client-supplied `role` is ignored. The JWT payload is
`{ sub, role, ver }` (subject id, current role, token version). A password reset
bumps `ver`, invalidating previously issued tokens.

## Error format (one new code)

```json
{ "error": { "code": "FORBIDDEN", "message": "..." } }
```

| Code | Status | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Malformed body / invalid upload type or size |
| `UNAUTHORIZED` | 401 | Missing/invalid/expired token, or invalidated session |
| `FORBIDDEN` | 403 | Authenticated but role not permitted |
| `NOT_FOUND` | 404 | Resource missing or not visible to the role |
| `CONFLICT` | 409 | Duplicate / invalid state transition |
| `INTERNAL_ERROR` | 500 | Server error |

## Auth (public + authenticated)

### `POST /api/auth/register` (v1 shape + `role`)

The response now includes `role` (always `STUDENT`):

```json
{ "user": { "id": 1, "nombre": "...", "apellidos": "...", "profesion": null, "edad": null, "correo": "...", "role": "STUDENT", "createdAt": "ISO" } }
```

A client-supplied `role` field is ignored.

### `POST /api/auth/login` (v1 shape + `role`)

The JWT now carries `{ sub, role, ver }` (expires in `JWT_EXPIRES_IN`, default `7d`):

```json
{ "token": "jwt", "user": { "id": 1, "nombre": "...", "correo": "...", "role": "STUDENT" } }
```

### `POST /api/auth/logout` (unchanged)

Response `204` (stateless; client discards the token).

### `GET /api/auth/me` (full identity + `role`)

Header: `Authorization: Bearer <token>`. Response `200`:

```json
{ "user": { "id": 1, "nombre": "...", "apellidos": "...", "profesion": null, "edad": null, "correo": "...", "role": "STUDENT" } }
```

### `POST /api/auth/forgot-password` (NEW)

Request:

```json
{ "correo": "string" }
```

Response `200` (always — enumeration-safe):

```json
{ "message": "Si el correo existe, recibirás instrucciones" }
```

For an existing user, a single-use, SHA-256-hashed reset token (15-minute TTL)
is created and delivered via `EMAIL_MODE` (`console` in dev logs it; `smtp` in
prod sends email).

### `POST /api/auth/reset-password` (NEW)

Request:

```json
{ "token": "string", "contraseña": "string (min 8)" }
```

Response `200`:

```json
{ "message": "Contraseña actualizada" }
```

Errors: `400` on invalid/expired/consumed token or a password shorter than 8
characters (the token is NOT consumed on a weak password).

## Courses (public)

`GET /api/courses` and `GET /api/courses/:slug` filter to `status = PUBLISHED`.
Draft/pending courses are omitted from the catalog and return `404` on direct
lookup.
