# Design: LMS Transformation

## Technical Approach

Backend-first, additive, contract-synced transformation of Velvet Health from a single-purpose first-aid course viewer into a role-scoped LMS. The strategy preserves everything that already works — the three seeded courses, their questions/options, user exam results, the server-side grading semantics, the logo, and the frozen v1 API shapes — while introducing a role model (`STUDENT`/`INSTRUCTOR`/`ADMIN`), a content model (modules + lessons), instructor onboarding with credential review, admin moderation, three dashboards, password recovery, and a premium frontend redesign.

The data model delta is realized as a single forward-only additive Prisma/PostgreSQL migration that backfills defaults (`User.role = STUDENT`, `Course.status = PUBLISHED`) so existing rows survive untouched. Authorization is layered: the existing `requireAuth` (identity) is composed before a new `requireRole` (permission) middleware. New endpoints are grouped by role (public / student / instructor / admin) and gated per group. The API contract is extended with a v2 section; v1 endpoint shapes are left byte-compatible so the existing client keeps working during the transition.

The frontend deletes `client/src/api/mock.ts`, wires every screen to the real API, adds role-aware routing and a role-aware `AuthProvider`, and is delivered in the proposal's seven phases.

---

## Architecture Decisions

### Decision: Single canonical instructor-application endpoint (`POST /api/instructor/applications`)

**Choice**: One endpoint — `POST /api/instructor/applications` — used by a `STUDENT` to apply and to re-apply after rejection. `POST /api/instructor/apply` is **not implemented**; it is superseded and documented as such.

**Alternatives considered**:
- Keep both `POST /api/instructor/apply` (student) and `POST /api/instructor/applications` (instructor) as the proposal's target surface lists them.
- Put the apply endpoint outside `/api/instructor/*` (e.g. `POST /api/me/instructor-application`).

**Rationale**: The applicant is *always* a `STUDENT`. An `APPROVED` application promotes the user to `INSTRUCTOR`, and an `INSTRUCTOR`'s application is terminal (cannot re-apply). There is no distinct "instructor re-applies" action — a rejected applicant is still a `STUDENT`. Two POST endpoints for the same action invite drift. Placing it under `/api/instructor/*` keeps the whole instructor-onboarding domain in one namespace, at the cost of a documented carve-out from the authorization spec's blanket "`/api/instructor/*` = INSTRUCTOR+ADMIN" rule (see the authorization decision below). The endpoint is submitted as `multipart/form-data` so credential documents upload atomically with the application.

**Spec conflict resolved**: The `authorization` spec ("endpoints under `/api/instructor/*` MUST be INSTRUCTOR+ADMIN only") conflicts with the `instructor-application` spec (a `STUDENT` MUST be able to apply via a `/api/instructor/*` path). This design resolves it as: `POST /api/instructor/applications` is the **one carve-out** on that namespace, authorized `requireAuth` + `requireRole(STUDENT, INSTRUCTOR)`; every other `/api/instructor/*` route is `requireRole(INSTRUCTOR, ADMIN)`. The allow-list includes `INSTRUCTOR` so the "approved application is terminal → 409" scenario reaches the controller instead of an early `403`.

### Decision: Application authorization — `requireRole(STUDENT, INSTRUCTOR)` with controller-enforced lifecycle

**Choice**: The apply endpoint admits `STUDENT` and `INSTRUCTOR`; `ADMIN` is rejected `403`. The controller then enforces the lifecycle: `PENDING` exists → `409`; caller role is `INSTRUCTOR` (or an `APPROVED` application exists) → `409`; otherwise create → `201`.

**Alternatives considered**: `requireRole(STUDENT)` only (then an `INSTRUCTOR` re-applying gets `403`, contradicting the spec's `409` scenario); no role gate (contradicts "non-applicable role → 403").

**Rationale**: This single composition satisfies every `instructor-application` scenario (success → 201, duplicate pending → 409, admin → 403, re-apply after rejection → new 201, approved terminal → 409) with no special cases at the routing layer.

### Decision: Credential document storage — local protected directory (with an S3 seam)

**Choice**: Store documents on local disk under `server/uploads/documents/` (outside the web root, gitignored), streamed only through the admin-authorized `GET /api/admin/documents/:id`. Introduce a `DocumentStorage` interface (`save`, `read`/`stream`) so an S3-compatible adapter can be dropped in later. Config key `DOCUMENT_STORAGE=local` (only `local` is built in this change).

**Alternatives considered**: S3-compatible object storage now (via `@aws-sdk/client-s3`); public URL serving.

**Rationale**: The project has no existing AWS/S3 dependency, bucket, or IAM setup; adding those is infra scope this change does not justify. The security requirement ("admin-only, never a public URL") is satisfied entirely by the local directory + admin endpoint, independent of the storage backend. The abstraction keeps an S3 migration cheap and non-invasive. **Explicit Render note**: Render's filesystem is ephemeral — files under `server/uploads/` are wiped on every redeploy/restart. Local disk is acceptable only for development/demo; a real production deployment of credential handling **requires** swapping in the S3 adapter (`DOCUMENT_STORAGE=s3`) before go-live. This is recorded as a dependency, not silently ignored.

### Decision: Password reset token — SHA-256 hash, single-use, expiring, 15-minute TTL

**Choice**: `POST /api/auth/forgot-password` generates `crypto.randomBytes(32).toString('hex')` as the raw token, stores `tokenHash = sha256(rawToken)`, `expiresAt = now + 15 min`, `consumed = false`. The raw token is delivered via SMTP in production; in development (`EMAIL_MODE=console`) it is logged/returned. `POST /api/auth/reset-password` hashes the submitted token and matches `tokenHash` + `consumed=false` + `expiresAt > now`.

**Alternatives considered**: bcrypt the token (slower, unnecessary for a 256-bit random secret); store raw token (leaks via DB read); JWT-based reset token.

**Rationale**: A 256-bit cryptographically random token has ~256 bits of entropy — a fast SHA-256 hash is the correct primitive (bcrypt is for low-entropy human passwords). Hashing means a DB leak cannot be replayed into password resets. Single-use + expiry + `consumed` flag satisfy the spec's reuse/expiry scenarios. A JWT reset token was rejected because stateless reset tokens cannot be revoked/consumed without server state.

### Decision: Session invalidation on password reset via `User.tokenVersion`

**Choice**: Add `User.tokenVersion Int @default(0)`. The JWT payload becomes `{ sub, role, ver }`. On password reset, increment `tokenVersion`. `requireAuth` is upgraded to an async middleware that (1) verifies signature/expiry, (2) does one indexed PK read of the user, (3) rejects `401` when `ver` does not match the current `tokenVersion` (invalidated session) or the user no longer exists, and (4) attaches `req.userId` + `req.userRole` (current role, refreshed from the DB).

**Alternatives considered**: Pure stateless `requireAuth` (signature-only) with "invalidate sessions" being best-effort; token denylist table.

**Rationale**: Stateless JWTs alone cannot be invalidated. A denylist table is more moving parts. A single PK-indexed read per authenticated request is cheap and buys two things at once: real session invalidation (spec-mandated) and immediate role freshness — a user approved as `INSTRUCTOR` gains instructor access without re-login. The `authorization` spec's "role claim is authoritative" wording is interpreted as "authorization uses the authenticated session's role, never a client-supplied field"; the DB read only *refreshes* that role and detects invalidation.

### Decision: Admin bootstrap via a dedicated idempotent seed script (no public admin registration)

**Choice**: `server/prisma/seed-admin.ts` reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` (and optional `ADMIN_NOMBRE`/`ADMIN_APELLIDOS`) and upserts one `ADMIN`. It creates the admin **only if** the email does not exist; if the email already exists, it never changes that user's role. Registration hard-codes `role = STUDENT`.

**Alternatives considered**: Extend the existing destructive `seed.ts`; a hidden registration flag; an env-driven first-boot role.

**Rationale**: The existing `seed.ts` wipes users/results when the course table is empty — coupling admin bootstrap to it would be destructive and unsafe. A separate, idempotent script satisfies "seed-only, idempotent, never escalates public users" (authorization spec). Registration's `role = STUDENT` (ignoring any client-supplied `role`) makes public escalation impossible.

### Decision: Legacy `courseInstructions.ts` re-seeded as structured Module/Lesson rows

**Choice**: Each of the three legacy courses gets one `Module` (e.g. title "Contenido del curso", `order = 1`) with one `Lesson` per instruction step (or a single lesson whose `content` holds the ordered steps). The seed marks them `status = PUBLISHED`, `createdById = null`. `GET /api/courses/:slug` keeps returning a flattened `instructions: string[]` (derived from lesson content) for v1 backward compatibility **and** adds structured `modules` for v2.

**Alternatives considered**: Keep `courseInstructions.ts` in code and only add modules for *new* courses; delete the instructions entirely.

**Rationale**: The proposal requires "re-seeded as structured lessons (content preserved, not deleted)" and "v1 shapes preserved". Deriving the flat `instructions` array from the re-seeded lessons satisfies both without maintaining a second source of truth. `createdById = null` keeps legacy courses ownerless so no instructor "inherits" them.

---

## Data Model (Prisma schema)

### Enums

```prisma
enum Role {
  STUDENT
  INSTRUCTOR
  ADMIN
}

enum CourseStatus {
  DRAFT
  PENDING
  PUBLISHED
}

enum InstructorApplicationStatus {
  PENDING
  APPROVED
  REJECTED
}
```

Three distinct enums: `CourseStatus` and `InstructorApplicationStatus` both contain `PENDING`, but as separate PostgreSQL enum types they must not be conflated.

### Changed + new models (full shapes)

```prisma
model User {
  id                     Int                       @id @default(autoincrement())
  nombre                 String
  apellidos              String
  profesion              String?
  edad                   Int?
  correo                 String                    @unique
  contraseña             String
  role                   Role                      @default(STUDENT)
  tokenVersion           Int                       @default(0)
  examResults            ExamResult[]
  instructorApplications InstructorApplication[]
  coursesCreated         Course[]
  passwordResetTokens    PasswordResetToken[]
  reviewedApplications   InstructorApplication[]   @relation("ReviewedApplications")
  createdAt              DateTime                  @default(now())
}

model Course {
  id            Int          @id @default(autoincrement())
  slug          String       @unique
  title         String
  description   String
  minutes       Int
  image         String
  passThreshold Int          @default(70)
  status        CourseStatus @default(PUBLISHED)
  createdById   Int?
  createdBy     User?        @relation(fields: [createdById], references: [id], onDelete: SetNull)
  modules       Module[]
  questions     Question[]
  examResults   ExamResult[]
}

model Module {
  id          Int      @id @default(autoincrement())
  courseId    Int
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title       String
  description String   @default("")
  order       Int
  lessons     Lesson[]
  @@index([courseId, order])
}

model Lesson {
  id              Int     @id @default(autoincrement())
  moduleId        Int
  module          Module  @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  title           String
  content         String
  order           Int
  durationMinutes Int?
  @@index([moduleId, order])
}

model InstructorApplication {
  id           Int                         @id @default(autoincrement())
  userId       Int
  user         User                        @relation(fields: [userId], references: [id], onDelete: Cascade)
  status       InstructorApplicationStatus @default(PENDING)
  reviewNotes  String?
  reviewedById Int?
  reviewedBy   User?                       @relation("ReviewedApplications", fields: [reviewedById], references: [id], onDelete: SetNull)
  reviewedAt   DateTime?
  documents    Document[]
  createdAt    DateTime                    @default(now())
  @@index([status])
  @@index([userId])
}

model Document {
  id            Int                   @id @default(autoincrement())
  applicationId Int
  application   InstructorApplication @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  fileName      String
  storagePath   String                @unique
  mimeType      String
  sizeBytes     Int
  uploadedAt    DateTime              @default(now())
  @@index([applicationId])
}

model PasswordResetToken {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String   @unique
  expiresAt DateTime
  consumed  Boolean  @default(false)
  createdAt DateTime @default(now())
  @@index([userId])
}
```

`Question`, `Option`, and `ExamResult` are **unchanged** (exam stays course-level).

### Relation-shape notes

- `User ↔ InstructorApplication` has **two** relations, so the reviewer side is named `"ReviewedApplications"` on both ends; the applicant side (`user`/`instructorApplications`) is the default single relation.
- `Course.createdBy` ↔ `User.coursesCreated` is a single relation; `createdById` is nullable with `onDelete: SetNull` so deleting a user does not delete their legacy published courses.
- `Document.storagePath` is `@unique` and server-generated (UUID + sanitized extension), never user-supplied (path-traversal defense).
- Professional data for an application is **not duplicated** on `InstructorApplication`: it lives on `User` (`nombre`, `apellidos`, `profesion`, `edad`) and is read through the `user` relation — "reusing the existing `profesion`/`edad` fields" literally. The application POST body accepts `profesion`/`edad` and the controller writes them back to the `User` record so the profile stays in sync with the latest application. Tradeoff (no immutable application snapshot) is acceptable at this scope; a snapshot-column alternative is documented in the Open Questions.

### Migration + backfills

The repo has **no `prisma/migrations/` history** today (no `migrations/` directory; the live DB was most likely initialized with `prisma db push`). This makes "forward-only additive migration" require a one-time baseline reconciliation. The concrete recipe:

1. Update `schema.prisma` with the delta above.
2. `npx prisma migrate dev --name add_lms_models --create-only` to author SQL without applying.
3. **Existing populated DB** (no `_prisma_migrations` table): generate the true delta with `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script > delta.sql`, review it, apply with `prisma db execute --file delta.sql`, then `npx prisma migrate resolve --applied add_lms_models` to record the baseline.
4. **Fresh dev/review DB**: the full-schema migration applies cleanly.

The delta SQL is purely additive and follows this shape:

```sql
CREATE TYPE "Role" AS ENUM ('STUDENT', 'INSTRUCTOR', 'ADMIN');
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED');
CREATE TYPE "InstructorApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Backfill: existing users become STUDENT; existing courses become PUBLISHED.
ALTER TABLE "User"   ADD COLUMN "role"         "Role"         NOT NULL DEFAULT 'STUDENT';
ALTER TABLE "User"   ADD COLUMN "tokenVersion" INTEGER        NOT NULL DEFAULT 0;
ALTER TABLE "Course" ADD COLUMN "status"       "CourseStatus" NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "Course" ADD COLUMN "createdById"  INTEGER;

CREATE TABLE "Module" ( /* id, courseId, title, description, order, + FK cascade, index(courseId,order) */ );
CREATE TABLE "Lesson" ( /* id, moduleId, title, content, order, durationMinutes, + FK cascade, index(moduleId,order) */ );
CREATE TABLE "InstructorApplication" ( /* id, userId, status, reviewNotes, reviewedById, reviewedAt, createdAt, + FKs, index(status), index(userId) */ );
CREATE TABLE "Document" ( /* id, applicationId, fileName, storagePath, mimeType, sizeBytes, uploadedAt, + FK cascade, index(applicationId) */ );
CREATE TABLE "PasswordResetToken" ( /* id, userId, tokenHash, expiresAt, consumed, createdAt, + FK cascade, index(userId) */ );

ALTER TABLE "Course" ADD CONSTRAINT "Course_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL;
```

Backfills are implicit via `NOT NULL DEFAULT` (every existing row receives the default atomically). For belt-and-suspenders idempotency on databases where the column predates the default, the migration includes explicit no-op-equivalent updates: `UPDATE "User" SET "role"='STUDENT' WHERE "role" IS NULL;` and `UPDATE "Course" SET "status"='PUBLISHED' WHERE "status" IS NULL;`. No `DROP`, no `RENAME`, no destructive delta.

### Seed changes

- `seed.ts`: seed the three legacy courses with `status = PUBLISHED`, `createdById = null`, and re-seed the instruction steps as `Module`/`Lesson` rows (content preserved). Keep the existing "only seed when courses table empty" guard.
- `seed-admin.ts` (new): idempotent admin bootstrap (see decision). Reads `ADMIN_EMAIL`/`ADMIN_PASSWORD`; creates the admin only if the email is absent; never escalates an existing user.
- `package.json`: add `"prisma:seed-admin": "node dist/prisma/seed-admin.js"` and register `seed-admin` under `prisma.seed` alternatives or a dedicated script.

---

## API Contract v2

The v2 contract is **additive**. All v1 shapes (register/login/me/courses/course-detail-with-instructions/exam/submit/results) remain byte-compatible; `role` is added to user payloads and the course detail gains `modules`. `docs/api-contract.md` is extended with a v2 section.

### Error format (unchanged, one new code)

```json
{ "error": { "code": "FORBIDDEN", "message": "..." } }
```

| Code | Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Malformed body / invalid upload type or size |
| `UNAUTHORIZED` | 401 | Missing/invalid token |
| `FORBIDDEN` | 403 | Authenticated but role not permitted |
| `NOT_FOUND` | 404 | Resource missing or not visible to the role |
| `CONFLICT` | 409 | Duplicate / invalid state transition |
| `INTERNAL_ERROR` | 500 | Server error |

### Public (no auth)

| Method & Path | Notes |
|---|---|
| `POST /api/auth/register` | v1; response user now includes `role: "STUDENT"`; client-supplied `role` ignored |
| `POST /api/auth/login` | v1; JWT now carries `role`; response user includes `role` |
| `POST /api/auth/logout` | v1; `204`, stateless |
| `POST /api/auth/forgot-password` | NEW; always `200` generic |
| `POST /api/auth/reset-password` | NEW |
| `GET /api/courses` | v1; now filters `status = PUBLISHED` |
| `GET /api/courses/:slug` | v1 + `modules`; `PUBLISHED` only, else `404` |
| `GET /api/courses/:slug/lessons` | NEW; `PUBLISHED` only |
| `GET /api/courses/:slug/exam` | v1; `PUBLISHED` only |

**`POST /api/auth/forgot-password`**
Request: `{ "correo": "string" }` → always `200 { "message": "Si el correo existe, recibirás instrucciones" }` (enumeration-safe).

**`POST /api/auth/reset-password`**
Request: `{ "token": "string", "contraseña": "string (min 8)" }` → `200 { "message": "Contraseña actualizada" }`; `400` on invalid/expired/consumed token or weak password.

**`GET /api/courses/:slug/lessons`** — response:
```json
{ "modules": [
  { "id": 1, "title": "Contenido del curso", "description": "", "order": 1,
    "lessons": [ { "id": 1, "title": "Paso 1", "content": "...", "order": 1, "durationMinutes": 2 } ] }
] }
```

### Student (auth, role `STUDENT`)

| Method & Path | Roles | Notes |
|---|---|---|
| `GET /api/auth/me` | any | now returns full identity + `role` |
| `GET /api/me/results` | any | self-scoped (unchanged shape) |
| `POST /api/courses/:slug/exam/submit` | any | self-scoped grading (unchanged) |
| `GET /api/me/dashboard` | STUDENT | NEW |
| `POST /api/instructor/applications` | STUDENT, INSTRUCTOR | NEW canonical apply/re-apply (multipart) |

**`GET /api/auth/me`** — response user gains full profile:
```json
{ "user": { "id": 1, "nombre": "...", "apellidos": "...", "profesion": null, "edad": null, "correo": "...", "role": "STUDENT" } }
```

**`POST /api/instructor/applications`** — `multipart/form-data`, fields: `profesion` (string, required), `edad` (number, optional), `documents` (files, 0..N). `201`:
```json
{ "application": { "id": 3, "status": "PENDING", "createdAt": "ISO" } }
```
Errors: `403` (ADMIN), `409` (existing `PENDING` application, or terminal `APPROVED`/`INSTRUCTOR`), `400` (invalid file type/size).

**`GET /api/me/dashboard`** — response:
```json
{ "dashboard": {
  "student": { "id": 1, "nombre": "...", "role": "STUDENT" },
  "progress": { "coursesStarted": 2, "coursesCompleted": 1, "totalCourses": 3 },
  "results": [ { "id": 42, "courseId": 1, "courseSlug": "rcp", "score": 80, "passed": true, "createdAt": "ISO" } ],
  "recommendations": [ { "id": 2, "slug": "hemorragias", "title": "Hemorragias Externas", "image": "hemorragia.png", "minutes": 60 } ]
} }
```
(`coursesStarted` = distinct courses with ≥1 result; `coursesCompleted` = courses with a `passed` result; `recommendations` = published courses not yet passed.)

### Instructor (auth, role `INSTRUCTOR` or `ADMIN`)

| Method & Path | Notes |
|---|---|
| `GET /api/instructor/courses` | own courses, all statuses |
| `POST /api/instructor/courses` | create → `status = DRAFT` |
| `GET /api/instructor/courses/:id` | own course w/ modules+lessons+questions |
| `PUT /api/instructor/courses/:id` | update own |
| `DELETE /api/instructor/courses/:id` | delete own |
| `POST /api/instructor/courses/:id/modules` | create module |
| `PUT /api/instructor/courses/:id/modules/:moduleId` | update module |
| `DELETE /api/instructor/courses/:id/modules/:moduleId` | delete module |
| `POST /api/instructor/courses/:id/modules/:moduleId/lessons` | create lesson |
| `PUT /api/instructor/courses/:id/modules/:moduleId/lessons/:lessonId` | update lesson |
| `DELETE /api/instructor/courses/:id/modules/:moduleId/lessons/:lessonId` | delete lesson |
| `POST /api/instructor/courses/:id/questions` | create question + options |
| `PUT /api/instructor/courses/:id/questions/:questionId` | update question + options |
| `DELETE /api/instructor/courses/:id/questions/:questionId` | delete question |
| `POST /api/instructor/courses/:id/submit` | request publish (`DRAFT` → `PENDING`) |
| `GET /api/instructor/dashboard` | own courses + stats |

**`POST /api/instructor/courses`** — request:
```json
{ "title": "string", "description": "string", "minutes": 30, "image": "string", "passThreshold": 70, "slug": "optional" }
```
`201 { "course": { "id": 10, "slug": "mi-curso", "title": "...", "status": "DRAFT", "createdById": 2, "...": "..." } }`. `slug` is server-generated from `title` when omitted (slugified + suffix on collision). Ownership is enforced server-side: non-owner update/delete → `403`.

**`POST /api/instructor/courses/:id/questions`** — request (exactly one option `isCorrect: true`):
```json
{ "prompt": "string", "order": 1, "options": [ { "text": "string", "isCorrect": true }, { "text": "string", "isCorrect": false } ] }
```

**`POST /api/instructor/courses/:id/submit`** — no body; `200 { "course": { "id": 10, "status": "PENDING" } }`; `409` if not `DRAFT`.

**`GET /api/instructor/dashboard`** — response:
```json
{ "dashboard": {
  "instructor": { "id": 2, "nombre": "...", "role": "INSTRUCTOR" },
  "stats": { "totalCourses": 5, "draft": 2, "pending": 1, "published": 2, "totalStudents": 120, "totalResults": 340 },
  "courses": [ { "id": 10, "slug": "...", "title": "...", "status": "PUBLISHED", "minutes": 20, "studentsCount": 90, "createdAt": "ISO" } ]
} }
```

### Admin (auth, role `ADMIN` only)

| Method & Path | Notes |
|---|---|
| `GET /api/admin/instructor-applications?status=` | list/filter applications |
| `POST /api/admin/instructor-applications/:id/approve` | `PENDING` → `APPROVED` + promote |
| `POST /api/admin/instructor-applications/:id/reject` | `PENDING` → `REJECTED` |
| `GET /api/admin/courses?status=PENDING` | course moderation queue |
| `POST /api/admin/courses/:id/approve` | `PENDING` → `PUBLISHED` |
| `POST /api/admin/courses/:id/reject` | `PENDING` → `DRAFT` |
| `GET /api/admin/dashboard` | platform stats |
| `GET /api/admin/users` | replaces `GET /api/users` |
| `GET /api/admin/documents/:id` | document download (binary) |

**`GET /api/admin/instructor-applications`** — response:
```json
{ "applications": [
  { "id": 1, "status": "PENDING", "createdAt": "ISO",
    "applicant": { "id": 5, "nombre": "...", "apellidos": "...", "correo": "...", "profesion": "Médico", "edad": 30 },
    "documents": [ { "id": 3, "fileName": "titulo.pdf", "mimeType": "application/pdf", "sizeBytes": 512000, "uploadedAt": "ISO" } ],
    "reviewedBy": null, "reviewedAt": null, "reviewNotes": null } ] }
```

**`POST /api/admin/instructor-applications/:id/approve`** — request `{ "reviewNotes": "optional" }` → `200 { "application": { "id": 1, "status": "APPROVED", "reviewedAt": "ISO" } }`; promotes applicant `role → INSTRUCTOR`; `409` if not `PENDING`.

**`POST /api/admin/instructor-applications/:id/reject`** — request `{ "reviewNotes": "required" }` → `200 { "application": { "id": 1, "status": "REJECTED" } }`; `400` if `reviewNotes` missing; `409` if not `PENDING`.

**`POST /api/admin/courses/:id/approve` / `reject`** — no body; `200 { "course": { "id": 10, "status": "PUBLISHED" } }` (or `"DRAFT"`); `409` if not `PENDING`.

**`GET /api/admin/dashboard`** — response:
```json
{ "dashboard": { "counts": {
  "users": 120, "students": 115, "instructors": 4, "admins": 1,
  "courses": 8, "publishedCourses": 3, "pendingCourses": 2,
  "applications": 6, "pendingApplications": 3, "results": 400 } } }
```

**`GET /api/admin/users`** — response: `{ "users": [ { "id": 1, "nombre": "...", "apellidos": "...", "profesion": null, "edad": null, "correo": "...", "role": "STUDENT", "createdAt": "ISO" } ] }`.

**`GET /api/admin/documents/:id`** — streams the file with `Content-Type: <stored mimeType>` and `Content-Disposition: attachment; filename="<fileName>"`. `404` if the document/application is missing; `403` non-admin; `401` unauthenticated.

### Contract change (one intentional v1 removal)

`GET /api/users` is **replaced** by `GET /api/admin/users` (admin-only), per the dashboards spec ("replaced"). The old route is removed from `app.ts`; calls to it return `404`. This is the single deliberate v1 break, authorized by the spec, and it is documented in the v2 section as a "breaking change (removal)".

---

## Auth + RBAC Implementation

### JWT claims

```ts
type AccessTokenPayload = { sub: number; role: Role; ver: number }
jwt.sign({ sub: user.id, role: user.role, ver: user.tokenVersion }, env.jwtSecret, { expiresIn: "7d" })
```

### Middleware composition

```
request → requireAuth (async) → requireRole(...allowed) → handler
```

- **`requireAuth` (modified, async)** — verifies `Bearer` token; parses `sub`, `role`, `ver`; reads the user once (PK-indexed, `select: { id, role, tokenVersion }`); `401` if the token is missing/invalid/expired, if `ver !== tokenVersion` (invalidated session), or if the user no longer exists; attaches `req.userId` and `req.userRole`.
- **`requireRole` (new)** — `requireRole(...roles: Role[])` returns middleware: `401` if `req.userId`/`req.userRole` are absent (i.e. `requireAuth` did not run), `403` if `req.userRole` is not in `roles`, else `next()`.
- **`express.d.ts` (modified)** — adds `userRole?: Role` (import `Role` from `@prisma/client`).

### Route gating map

| Prefix | Guard |
|---|---|
| `/api/admin/*` | `requireAuth` + `requireRole(ADMIN)` |
| `/api/instructor/*` (except below) | `requireAuth` + `requireRole(INSTRUCTOR, ADMIN)` |
| `/api/instructor/applications` (POST) | `requireAuth` + `requireRole(STUDENT, INSTRUCTOR)` — **carve-out** |
| `/api/me/dashboard` | `requireAuth` + `requireRole(STUDENT)` |
| `/api/me/results`, exam submit | `requireAuth` (any role, self-scoped) |
| `/api/auth/me` | `requireAuth` |
| `/api/courses*` public reads | none (server enforces `PUBLISHED` filter) |

### Password reset / recovery flow

1. **Forgot**: client POSTs `{ correo }`. Server always returns `200` generic. If a user exists, generate raw token (32 random bytes), store `PasswordResetToken { tokenHash: sha256(raw), expiresAt: now+15m, consumed: false }`, and deliver raw token via `EMAIL_MODE`. `EMAIL_MODE=smtp` (prod) sends email; `EMAIL_MODE=console` (dev) logs/returns the raw token in the response (dev-only, explicitly configured).
2. **Reset**: client POSTs `{ token, contraseña }`. Server hashes `token`, finds a matching unconsumed unexpired `PasswordResetToken`; `400` otherwise. On success: `bcrypt.hash` the new password, update the user, `consumed = true`, `tokenVersion += 1` (invalidates prior JWTs). `200`.
3. Weak password (< 8) → `400` and the token is **not** consumed.

### Admin bootstrap

`seed-admin.ts` (idempotent; see decision). Registration never accepts a role; `auth.controller.register` always creates with `role: STUDENT`.

---

## Document Storage

- **Ingest**: `POST /api/instructor/applications` uses multer (new `middleware/upload.ts`) configured with a memory or disk destination under `server/uploads/documents/` (resolved from `env.uploadDir`, default `./uploads/documents`, outside the web root and `.gitignore`d). Files are stored under a server-generated `UUID.ext` name (extension derived from the allowlist, never from user input).
- **Validation**: MIME allowlist `application/pdf`, `image/jpeg`, `image/png`; max size `MAX_UPLOAD_BYTES = 5 * 1024 * 1024` (configurable). Rejection → `400 VALIDATION_ERROR` (per spec). Magic-byte verification via `file-type` is **recommended** (prevents MIME spoofing / stored-XSS / MIME confusion when an admin downloads); declared-mimetype-only is the fallback if the dependency is avoided.
- **Retrieval**: only `GET /api/admin/documents/:id` (admin). Streams via `res.sendFile`/`res.download` after resolving `storagePath` **within** the upload dir and confirming containment (path-traversal defense). `Content-Disposition: attachment` + stored `Content-Type`.
- **Storage abstraction**: `lib/storage.ts` exposes `DocumentStorage { save(file): Promise<{ storagePath, mimeType, sizeBytes }>; open(storagePath): Readable }`; a `LocalStorage` implementation ships now; an `S3Storage` adapter is scaffolded behind `DOCUMENT_STORAGE=local|s3` (S3 env: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`). Render note: local disk is ephemeral; object storage is required for production.

---

## Server File Layout

| File | Action | Description |
|---|---|---|
| `server/prisma/schema.prisma` | Modify | Add `Role`/`CourseStatus`/`InstructorApplicationStatus` enums, `Module`/`Lesson`/`InstructorApplication`/`Document`/`PasswordResetToken` models, `User.role`+`tokenVersion`+relations, `Course.status`+`createdById`+`modules` |
| `server/prisma/migrations/<ts>_add_lms_models/migration.sql` | Create | Forward-only additive migration + backfills |
| `server/prisma/seed.ts` | Modify | Re-seed legacy courses as `PUBLISHED` with `Module`/`Lesson` rows |
| `server/prisma/seed-admin.ts` | Create | Idempotent admin bootstrap |
| `server/src/middleware/requireAuth.ts` | Modify | Async; parse `role`+`ver`, validate against user, attach `req.userId`/`req.userRole` |
| `server/src/middleware/requireRole.ts` | Create | Role-gating middleware |
| `server/src/middleware/upload.ts` | Create | Multer config (storage, fileFilter, limits) |
| `server/src/controllers/auth.controller.ts` | Modify | Role in register/login/me; forgot/reset handlers |
| `server/src/controllers/instructor.controller.ts` | Create | Application submit; course/module/lesson/question CRUD; submit-for-review; instructor dashboard |
| `server/src/controllers/admin.controller.ts` | Create | Applications list/approve/reject; course queue/approve/reject; user list |
| `server/src/controllers/dashboard.controller.ts` | Create | Student dashboard (and shared dashboard aggregation helpers) |
| `server/src/controllers/document.controller.ts` | Create | Admin document download |
| `server/src/controllers/course.controller.ts` | Modify | `PUBLISHED` filter; modules in detail; lessons endpoint; slug generation |
| `server/src/controllers/exam.controller.ts` | Modify | `PUBLISHED`-only guard on get/submit |
| `server/src/controllers/me.controller.ts` | Modify | Add student dashboard (or delegate to dashboard controller) |
| `server/src/controllers/user.controller.ts` | Modify | Move under admin; add `role`/`createdAt` |
| `server/src/routes/instructor.routes.ts` | Create | Role-grouped instructor routes (with apply carve-out) |
| `server/src/routes/admin.routes.ts` | Create | Role-grouped admin routes |
| `server/src/routes/auth.routes.ts` | Modify | Add forgot/reset |
| `server/src/routes/course.routes.ts` | Modify | Add `/lessons`; keep public routes |
| `server/src/routes/me.routes.ts` | Modify | Add `/dashboard` |
| `server/src/routes/user.routes.ts` | Delete/Move | Replaced by `GET /api/admin/users` |
| `server/src/schemas/auth.schema.ts` | Modify | `forgotPasswordSchema`, `resetPasswordSchema` |
| `server/src/schemas/course.schema.ts` | Create | course/module/lesson/question create+update zod schemas |
| `server/src/schemas/instructor.schema.ts` | Create | application form-field schema (validates parsed multipart fields) |
| `server/src/schemas/admin.schema.ts` | Create | approve/reject `reviewNotes` schemas |
| `server/src/config/env.ts` | Modify | `jwtExpiresIn`, `resetTokenTtlMinutes`, `emailMode`/SMTP, `uploadDir`, `maxUploadBytes`, `docStorage`, S3 keys |
| `server/src/lib/storage.ts` | Create | `DocumentStorage` interface + `LocalStorage` |
| `server/src/utils/tokens.ts` | Create | `generateResetToken` / `hashResetToken` (crypto) |
| `server/src/types/express.d.ts` | Modify | Add `userRole?: Role` |
| `server/src/app.ts` | Modify | Mount instructor/admin routers; remove `/api/users` |
| `server/package.json` | Modify | Add `multer` + `@types/multer` (and `file-type` if magic-byte sniffing adopted); `prisma:seed-admin` script |
| `server/.env.example` | Modify | Add new env vars |
| `server/.gitignore` | Modify | Ignore `uploads/` |
| `docs/api-contract.md` | Modify | Append v2 section (v1 preserved) |

---

## Frontend Architecture

### Route map

| Path | Role gate | Screen |
|---|---|---|
| `/` | public | Landing (premium marketing home) |
| `/practicas` | public | Catalog (redesigned) |
| `/cursos/:slug` | public | Course page + lesson list |
| `/cursos/:slug/lecciones/:lessonId` | public | Lesson player |
| `/cursos/:slug/examen` | any auth | Exam (loading states) |
| `/login` / `/registro` | public | Premium validated forms |
| `/recuperar` | public | Forgot password |
| `/restablecer` | public | Reset password (token via query) |
| `/perfil` | any auth | Enriched profile |
| `/dashboard` | STUDENT | Student dashboard |
| `/aplicar-instructor` | STUDENT | Instructor application form |
| `/instructor` | INSTRUCTOR | Instructor dashboard |
| `/instructor/cursos/nuevo` | INSTRUCTOR | Course editor (create) |
| `/instructor/cursos/:id/editar` | INSTRUCTOR | Course editor (edit modules/lessons/questions) |
| `/admin` | ADMIN | Admin dashboard |
| `/admin/solicitudes` | ADMIN | Instructor-application moderation |
| `/admin/cursos` | ADMIN | Course publication queue |
| `/admin/usuarios` | ADMIN | User list |

### Role-aware routing (`ProtectedRoute`)

Refactor `ProtectedRoute` to accept `roles?: Role[]`:

```tsx
<Route element={<ProtectedRoute roles={['STUDENT']} />}>
  <Route path="/dashboard" element={<StudentDashboard />} />
</Route>
```

Logic: no token → `Navigate to="/login" state={{ from }}`; session still hydrating (`loading`) → render a skeleton; token present but `user.role` not in `roles` → `Navigate to="/"` (landing). The `role` comes from `AuthProvider` (not from localStorage or the URL).

### `AuthProvider` (role-aware)

- `AuthUser` gains `role: Role`. `getMe()` now returns the full profile incl. `role`; `login` response user includes `role`.
- Context value adds role helpers: `isStudent`, `isInstructor`, `isAdmin` (or a `hasRole(role)`). The Header nav and `ProfileDropdown` render role-appropriate links ("Dashboard", "Instructor", "Admin") based on these.
- Hydration unchanged (token → `getMe`); on `401` during hydration, clear the token.

### API modules (`client/src/api`)

| File | Action | Description |
|---|---|---|
| `types.ts` | Modify | `Role` type, `Module`/`Lesson`/`InstructorApplication`/`Document`/dashboard types, `role` on `AuthUser`/`User` |
| `client.ts` | Modify | Add `apiUpload` (multipart `FormData`) and `apiDownload` (blob → trigger download); keep `apiFetch` for JSON |
| `auth.ts` | Modify | Add `forgotPassword`/`resetPassword`; remove mock fallback |
| `courses.ts` | Modify | Add `getLessons`; remove mock fallback |
| `exam.ts` | Modify | Remove mock fallback |
| `results.ts` | Modify | Remove mock fallback; `getUsers` → admin users module |
| `dashboard.ts` | Create | `getStudentDashboard`, `getInstructorDashboard`, `getAdminDashboard` |
| `instructor.ts` | Create | course/module/lesson/question CRUD, `submitForReview`, `submitApplication` (multipart) |
| `admin.ts` | Create | applications list/approve/reject, courses approve/reject, users, document download |
| `index.ts` | Modify | Export new modules |
| `mock.ts` | **Delete** | No mock source remains |

All modules drop the `catch (e) { if (e instanceof NetworkError) return mock... }` pattern and instead surface `NetworkError`/`ApiError` to screens for the loading/error strategy.

### State management

Keep the existing lightweight pattern — `AuthProvider` (single auth context) for identity/role; per-screen local state via `useState`/`useEffect` for data. Introduce a `useAsyncData(fetcher, deps)` hook returning `{ data, loading, error, reload }` to standardize the skeleton/error pattern without adding a global store (consistent with the current app; no Redux/Zustand).

### Design-system token plan (`index.css`)

Extend the Tailwind v4 `@theme` with:
- **Status colors**: `--color-draft` (amber), `--color-pending` (blue), `--color-published` (green), `--color-rejected` (red), `--color-approved` (green).
- **Role badges**: `.badge-role`, `.badge-status` component classes.
- **Feedback**: `--color-danger` (form error red), `--color-muted` (empty/disabled text).
- **Skeleton**: shimmer keyframes + `.skeleton`, `.skeleton-card`, `.skeleton-row` utilities.
- Keep brand (`--color-primary`, `--color-accent`, Montserrat/Playfair, `--radius-card`, `--shadow-card`).

### Loading / skeleton / error strategy

- Shared `Skeleton` (shimmer), `Spinner`, `EmptyState`, and `ErrorState` components; `ErrorState` distinguishes `NetworkError` (retry) from `ApiError` (message + code).
- Every data-fetching screen: `loading` → skeleton; `error` → `ErrorState`; `empty` → `EmptyState`; success → content. The existing `PageTransition` (framer-motion) is preserved and reused for the redesign; microinteractions follow the current `motion` pattern.

---

## Data Flow

```
Browser
  │  (role-aware ProtectedRoute + AuthProvider)
  ▼
Express app
  │  requireAuth (verify JWT → user id/role/tokenVersion)
  │  requireRole (allow-list)             ── 401 / 403 on failure
  ▼
Controller (zod/multer validation) ── 400 VALIDATION_ERROR on bad input
  │
  ├── Prisma (PostgreSQL)  ── reads/writes + transactions
  │       │
  │       └── DocumentStorage (local dir now, S3 seam)  ── admin-only download
  │
  └── Response (role-scoped JSON) ──→ Browser
```

Instructor application (the critical multi-part flow):

```
Student ── multipart(form fields + files) ──→ requireAuth → requireRole(STUDENT,INSTRUCTOR)
   → upload (multer: allowlist + size) → controller:
       1. existing PENDING? → 409
       2. INSTRUCTOR/APPROVED? → 409
       3. tx: update User.profesion/edad, create InstructorApplication(PENDING) + Documents
   → 201
```

Admin approval:

```
Admin ── POST /admin/instructor-applications/:id/approve ──→ requireRole(ADMIN)
   → controller: status must be PENDING (else 409)
       1. tx: set status=APPROVED, reviewedById, reviewedAt, reviewNotes
       2. promote User.role=INSTRUCTOR
   → 200
```

---

## Testing Strategy

> `strict_tdd` is off (no workspace test runner detected). Verification is `tsc` typecheck both projects + a documented manual checklist. No test files are authored in this change unless a runner is introduced; the strategy below defines the verification surface for the apply phase.

| Layer | What to verify | Approach |
|---|---|---|
| Typecheck (server) | New controllers/routes/schemas/middleware compile; Prisma client regenerated | `npm run typecheck` in `server/` |
| Typecheck (client) | New screens/api modules/role-aware routes compile | `npm run build` (tsc -b) in `client/` |
| Migration | Additive + backfills; existing rows preserved | Inspect generated SQL; `prisma migrate diff` delta review; verify `role`/`status` backfilled on a populated DB |
| RBAC | Every protected endpoint returns 401/403 correctly per role | Manual checklist: for each route in the gating map, exercise missing token (401), wrong role (403), right role (200) |
| Password reset | forgot → token → reset → login; reuse/expiry → 400 | Manual E2E with `EMAIL_MODE=console` |
| Instructor lifecycle | apply → admin approve (role promotes) → course CRUD → submit → admin publish | Manual E2E |
| Document security | non-admin/anon denied (401/403); admin download streams with correct headers | Manual E2E |
| Frontend UX | loading/error/empty states, role redirects, responsive at 3 widths | Manual review; oxlint |

---

## Threat Matrix

`N/A` — this change introduces no routing/shell/subprocess, version-control/PR automation, executable-file classification, or process-integration boundary. The matrix in `references/threat-matrix.md` (documentation-like paths, git selection, commit/push/PR states) does not apply to a React/Express web application. The one adjacent concern — credential document upload — is addressed in the document-storage decision (MIME allowlist + size limit + magic-byte sniffing + admin-only streaming + path-traversal containment), which is a normal application security concern, not one of the matrix's tool-boundary rows; no matrix rows are manufactured.

---

## Migration / Rollout

- **Migration**: forward-only additive (see Data Model section), with the one-time baseline reconciliation because the repo has no migration history.
- **Rollout**: phased per the proposal (foundation → auth/RBAC → content+CRUD → dashboards → public/student frontend → dashboards/moderation frontend → polish). Backend and frontend deploy independently; the additive contract lets the v1 client keep working until the redesigned client lands.
- **Rollback**: additive migration ⇒ revert the offending commit + redeploy the prior build (no data dropped/renamed). For a broken migration, restore the pre-migration snapshot + `git revert`. Admin seed is idempotent and never escalates public users.

---

## Open Questions

- [ ] **Live DB baseline**: does the existing PostgreSQL database have a `_prisma_migrations` table (created via `migrate`) or was it initialized with `db push`? Determines whether the delta is applied via `prisma migrate diff` + `resolve --applied` (populated DB) or a clean `migrate dev` (fresh DB). Needs a decision at apply time.
- [ ] **SMTP provider** for production password reset (host/port/credentials); dev uses `EMAIL_MODE=console`.
- [ ] **Object storage provider** for production documents (S3/R2/Spaces) — local disk ships now; S3 adapter is deferred but required for Render production.
- [ ] **Application snapshot**: confirm professional data on `User` (referenced, no snapshot) is acceptable vs. adding snapshot columns (`profesion`/`edad` copied onto `InstructorApplication`) for immutable review history.
- [ ] **`GET /api/users` removal**: confirm the old path may be removed (returns `404`) rather than kept as an admin-only alias.
