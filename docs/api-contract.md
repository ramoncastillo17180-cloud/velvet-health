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
