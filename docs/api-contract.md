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

### `GET /api/courses` (PUBLISHED only)

Catalog now returns only `PUBLISHED` courses (v1 shape unchanged otherwise):

```json
{ "courses": [ { "id": 1, "slug": "rcp", "title": "...", "description": "...", "minutes": 20, "image": "reanimacion.png", "passThreshold": 70 } ] }
```

### `GET /api/courses/:slug` (PUBLISHED only, + `modules`)

Returns `404` for a `DRAFT`, `PENDING`, or unknown course. A published course
gains structured `modules` **and** keeps the legacy flattened `instructions`
array (derived from lesson content):

```json
{
  "course": {
    "id": 1, "slug": "rcp", "title": "...", "description": "...",
    "minutes": 20, "image": "reanimacion.png", "passThreshold": 70,
    "instructions": [ "..." ],
    "modules": [
      { "id": 1, "title": "Contenido del curso", "description": "", "order": 1,
        "lessons": [ { "id": 1, "title": "Paso 1", "content": "...", "order": 1, "durationMinutes": null } ] }
    ]
  }
}
```

### `GET /api/courses/:slug/lessons` (NEW)

Returns only the structured lesson content of a `PUBLISHED` course (`404`
otherwise):

```json
{
  "modules": [
    { "id": 1, "title": "Contenido del curso", "description": "", "order": 1,
      "lessons": [ { "id": 1, "title": "Paso 1", "content": "...", "order": 1, "durationMinutes": null } ] }
  ]
}
```

### `GET /api/courses/:slug/exam` + `POST /api/courses/:slug/exam/submit` (PUBLISHED only)

Both now return `404` for a non-`PUBLISHED` course. The public exam response
still omits `isCorrect`; grading is unchanged.

---

# API Contract v2 — Instructor + Admin + Documents

> Phase 3 (content model + CRUD + approval). Instructor endpoints are authorized
> for `INSTRUCTOR` and `ADMIN`; admin endpoints for `ADMIN` only; the single
> instructor-application carve-out is documented below.

## Instructor (role `INSTRUCTOR` or `ADMIN`)

All routes require `Authorization: Bearer <token>`. A `STUDENT` receives `403`.

### `POST /api/instructor/applications` (canonical, multipart)

The **one carve-out** on `/api/instructor/*`: authorized for `STUDENT` and
`INSTRUCTOR` (an `ADMIN` receives `403`). A `STUDENT` applies and, after a
rejection, re-applies through this same endpoint. `POST /api/instructor/apply`
is **superseded and not implemented**.

Request: `multipart/form-data`.

| Field | Type | Required |
| --- | --- | --- |
| `profesion` | string | yes |
| `edad` | number (parsed from string) | no |
| `documents` | file(s) — `application/pdf`, `image/jpeg`, `image/png` | no (0..N) |

Response `201`:

```json
{ "application": { "id": 3, "status": "PENDING", "createdAt": "ISO" } }
```

Errors: `403` (ADMIN), `409` (existing `PENDING` application, or terminal
`APPROVED`/caller is `INSTRUCTOR`), `400` (invalid file type or oversized upload
> `MAX_UPLOAD_BYTES`, default 5 MB).

### Instructor course CRUD

| Method & Path | Notes |
| --- | --- |
| `GET /api/instructor/courses` | own courses, all statuses |
| `POST /api/instructor/courses` | create → `status = DRAFT`, `slug` server-generated |
| `GET /api/instructor/courses/:id` | own course with modules+lessons+questions |
| `PUT /api/instructor/courses/:id` | update own |
| `DELETE /api/instructor/courses/:id` | delete own |
| `POST /api/instructor/courses/:id/modules` | create module |
| `PUT /api/instructor/courses/:id/modules/:moduleId` | update module |
| `DELETE /api/instructor/courses/:id/modules/:moduleId` | delete module |
| `POST /api/instructor/courses/:id/modules/:moduleId/lessons` | create lesson |
| `PUT /api/instructor/courses/:id/modules/:moduleId/lessons/:lessonId` | update lesson |
| `DELETE /api/instructor/courses/:id/modules/:moduleId/lessons/:lessonId` | delete lesson |
| `POST /api/instructor/courses/:id/questions` | create question + options |
| `PUT /api/instructor/courses/:id/questions/:questionId` | update question + options (replaces options) |
| `DELETE /api/instructor/courses/:id/questions/:questionId` | delete question |
| `POST /api/instructor/courses/:id/submit` | request publish (`DRAFT` → `PENDING`) |

Ownership is enforced server-side: updating or deleting a course the caller does
not own returns `403`. Deleting a resource returns `204`.

**`POST /api/instructor/courses`** — request:

```json
{ "title": "string", "description": "string", "minutes": 30, "image": "string", "passThreshold": 70, "slug": "optional" }
```

Response `201` (slug is server-generated from `title` when `slug` is omitted,
slugified + suffix on collision):

```json
{ "course": { "id": 10, "slug": "mi-curso", "title": "...", "status": "DRAFT", "createdById": 2 } }
```

**`POST /api/instructor/courses/:id/questions`** — request (exactly one option
`isCorrect: true`, at least two options):

```json
{ "prompt": "string", "order": 1, "options": [ { "text": "string", "isCorrect": true }, { "text": "string", "isCorrect": false } ] }
```

**`POST /api/instructor/courses/:id/submit`** — no body. Response `200`
`{ "course": { "id": 10, "status": "PENDING" } }`; `409` if not `DRAFT`.

## Admin (role `ADMIN` only)

All routes require `Authorization: Bearer <token>`. `STUDENT`/`INSTRUCTOR`
receive `403`.

### `GET /api/admin/instructor-applications?status=`

List/filter applications (`status` ∈ `PENDING` | `APPROVED` | `REJECTED`;
omitted → all). Includes applicant identity and document metadata, never
document binary content.

```json
{
  "applications": [
    { "id": 1, "status": "PENDING", "createdAt": "ISO",
      "applicant": { "id": 5, "nombre": "...", "apellidos": "...", "correo": "...", "profesion": "Médico", "edad": 30 },
      "documents": [ { "id": 3, "fileName": "titulo.pdf", "mimeType": "application/pdf", "sizeBytes": 512000, "uploadedAt": "ISO" } ],
      "reviewedAt": null, "reviewNotes": null } ]
}
```

### `POST /api/admin/instructor-applications/:id/approve`

Request `{ "reviewNotes": "optional" }`. On `PENDING`: `status = APPROVED`,
applicant `role → INSTRUCTOR`, reviewer + `reviewNotes` recorded. Response `200`
`{ "application": { "id": 1, "status": "APPROVED", "reviewedAt": "ISO" } }`.
`409` if not `PENDING`.

### `POST /api/admin/instructor-applications/:id/reject`

Request `{ "reviewNotes": "required" }`. On `PENDING`: `status = REJECTED`, role
stays `STUDENT`, reviewer + `reviewNotes` recorded. Response `200`
`{ "application": { "id": 1, "status": "REJECTED" } }`. `400` if `reviewNotes`
missing; `409` if not `PENDING`.

### `GET /api/admin/courses?status=PENDING`

Course moderation queue (defaults to `PENDING`; `status` may also be `DRAFT` or
`PUBLISHED`). Returns courses with owner metadata.

### `POST /api/admin/courses/:id/approve` / `reject`

No body. `approve`: `PENDING` → `PUBLISHED`; `reject`: `PENDING` → `DRAFT`.
Response `200` `{ "course": { "id": 10, "status": "PUBLISHED" } }` (or
`"DRAFT"`). `409` if not `PENDING`.

### `GET /api/admin/documents/:id` (binary)

Streams a credential document with `Content-Type: <stored mimeType>` and
`Content-Disposition: attachment; filename="<fileName>"`. `404` missing;
`403` non-admin; `401` unauthenticated. There is no public URL for any document.

---

# API Contract v2 — Dashboards + Admin Users

> Phase 4 (dashboard APIs + admin user list). Adds the three role-scoped
> dashboards and replaces the generic user list with an admin-only endpoint. All
> routes require `Authorization: Bearer <token>`.

## Student dashboard

### `GET /api/me/dashboard`

Authorized for `STUDENT` only (`403` for any other role). Returns the
authenticated student's progress, self-scoped results, and recommendations.

Response `200`:

```json
{
  "dashboard": {
    "student": { "id": 1, "nombre": "...", "role": "STUDENT" },
    "progress": { "coursesStarted": 2, "coursesCompleted": 1, "totalCourses": 3 },
    "results": [ { "id": 42, "courseId": 1, "courseSlug": "rcp", "score": 80, "passed": true, "createdAt": "ISO" } ],
    "recommendations": [ { "id": 2, "slug": "hemorragias", "title": "Hemorragias Externas", "image": "hemorragia.png", "minutes": 60 } ]
  }
}
```

Semantics: `coursesStarted` = distinct courses with at least one result;
`coursesCompleted` = distinct courses with a passing result; `totalCourses` =
published courses; `recommendations` = published courses the student has not yet
passed.

## Instructor dashboard

### `GET /api/instructor/dashboard`

Authorized for `INSTRUCTOR` and `ADMIN` (`403` for `STUDENT`). Returns the
caller's own courses (all statuses) with per-course enrollment and aggregate
statistics scoped to that instructor.

Response `200`:

```json
{
  "dashboard": {
    "instructor": { "id": 2, "nombre": "...", "role": "INSTRUCTOR" },
    "stats": { "totalCourses": 5, "draft": 2, "pending": 1, "published": 2, "totalStudents": 120, "totalResults": 340 },
    "courses": [ { "id": 10, "slug": "...", "title": "...", "status": "PUBLISHED", "minutes": 20, "studentsCount": 90 } ]
  }
}
```

`studentsCount` = distinct students with a result in that course;
`totalStudents` = distinct students across all owned courses; `totalResults` =
total exam results across owned courses.

## Admin dashboard

### `GET /api/admin/dashboard`

Authorized for `ADMIN` only (`403` otherwise). Returns platform-wide aggregate
counts.

Response `200`:

```json
{
  "dashboard": {
    "counts": {
      "users": 120, "students": 115, "instructors": 4, "admins": 1,
      "courses": 8, "publishedCourses": 3, "pendingCourses": 2,
      "applications": 6, "pendingApplications": 3, "results": 400
    }
  }
}
```

## Admin users

### `GET /api/admin/users`

Authorized for `ADMIN` only (`403` otherwise). Returns all users, including
`role` and `createdAt`.

Response `200`:

```json
{ "users": [ { "id": 1, "nombre": "...", "apellidos": "...", "profesion": null, "edad": null, "correo": "...", "role": "STUDENT", "createdAt": "ISO" } ] }
```

### Breaking change (removal)

`GET /api/users` is **removed** and **replaced** by `GET /api/admin/users`
(admin-only). The old route is deleted from the server; calls to
`GET /api/users` now return `404`. This is the single deliberate v1 break in the
transformation.
