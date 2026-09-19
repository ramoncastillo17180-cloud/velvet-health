# Proposal: LMS Transformation

## Intent

Transform Velvet Health — currently a single-purpose medical first-aid course platform — into a full, modern LMS without discarding what already works. Today the app has public course browsing, a server-graded exam, and a basic JWT auth flow with a flat `User` model and a hardcoded, role-less data model. It is a course viewer, not a learning management system.

This change introduces real multi-role access control (student / instructor / admin), a content model (modules + lessons), instructor onboarding with credential review, admin moderation of both instructors and published courses, three role-scoped dashboards, password recovery, and a premium redesign of every screen. Existing courses, users, seed data, the logo, and the existing exam grading flow are conserved; the frozen API contract is extended, not broken.

## Scope

### In Scope

- **Data model delta**: `User.role` enum, `InstructorApplication`, `Course.status`, `Module`, `Lesson`, password-reset token storage, and credential document storage — with an additive, non-destructive Prisma/PostgreSQL migration.
- **Authentication & sessions**: real auth with roles, password reset/recovery, secure sessions; registration always creates a `STUDENT` (no public admin self-registration).
- **Authorization**: role-based route/endpoint protection (`requireAuth` + `requireRole`), applied across all protected endpoints.
- **Instructor onboarding**: application flow capturing professional data + credential documents, with admin approval/rejection.
- **Content management**: CRUD for courses/modules/lessons/exams (instructor-owned), with admin approval before a course becomes `PUBLISHED`.
- **Dashboards**: three role-scoped dashboard APIs (student, instructor, admin).
- **Frontend**: new screens (landing, lesson player, instructor application, admin moderation, three dashboards, password reset) and a premium redesign of all existing screens with animations, microinteractions, loading states, and full responsiveness.
- **Contract**: extend `docs/api-contract.md` with the new role-grouped endpoints while preserving v1 shapes.

### Out of Scope

- Payment/subscription billing or commerce.
- Real-time collaboration, chat, or notifications beyond transactional email for password reset.
- Learning analytics/reporting beyond the dashboard metrics required by this change.
- Certificate generation/issuance (deferred).
- Third-party SSO / OAuth (Google, LinkedIn, etc.).
- Migration of the exam grading model to per-lesson quizzes (exams stay course-level in this change).
- Content authoring WYSIWYG beyond a structured lesson-content field (no rich-text editor plugin work).

## Capabilities

> Contract between proposal and specs phases. `openspec/specs/` is currently empty (no existing specs), so every capability below is new.

### New Capabilities

- `authentication`: register/login/logout/me, password reset and recovery, secure sessions, and the rule that public registration always yields `STUDENT`.
- `authorization`: the role model (`STUDENT`/`INSTRUCTOR`/`ADMIN`) and role-based protection of routes and endpoints, including document access restrictions.
- `instructor-application`: instructor application lifecycle (submit → review → approve/reject), credential document upload, and document protection.
- `course-management`: course/module/lesson/exam CRUD, course `status` lifecycle (`DRAFT`/`PENDING`/`PUBLISHED`), and admin publish approval.
- `dashboards`: role-scoped data APIs for student, instructor, and admin dashboards.
- `lms-frontend`: new screens and the premium redesign of all existing screens, including the removal of mock data.

### Modified Capabilities

None — there are no existing specs in `openspec/specs/` to modify. (Existing behavior is defined by the frozen API contract and code, which are conserved and extended.)

## Approach

**Backend-first, additive migration, contract-synced.** Extend the Prisma schema with new models and enums using a single forward-only migration that backfills defaults (`User.role = STUDENT`, `Course.status = PUBLISHED`) so existing rows survive untouched. Introduce a `requireRole` middleware composed after the existing `requireAuth`. Group new endpoints by role (public / student / instructor / admin) and gate each group with the appropriate middleware. Extend `docs/api-contract.md` with a v2 section for the new endpoints while leaving v1 endpoint shapes intact, so the existing frontend keeps working during the transition.

**Document storage** uses a protected upload directory (or object storage) served exclusively through an admin-authorized endpoint — never a public URL — with content-type and size validation on ingest.

**Frontend** replaces mock data (`client/src/api/mock.ts`) with real API calls, adds role-aware routing, and builds the new screens and redesign incrementally, phase by phase, against the extended contract.

### Target data model delta

| Model / Field | Change | Notes |
|---|---|---|
| `User.role` | Added (enum `STUDENT`/`INSTRUCTOR`/`ADMIN`, default `STUDENT`) | Backfill existing rows to `STUDENT` |
| `User` relations | Added: `instructorApplications`, `coursesCreated`, `passwordResetTokens`, `reviewedApplications` | Reuses existing `profesion`/`edad` for instructor profile |
| `InstructorApplication` | New | `id`, `userId` FK, professional fields, `status` (`PENDING`/`APPROVED`/`REJECTED`), `reviewNotes`, `reviewedById`, timestamps |
| `Document` | New | `id`, `applicationId` FK, `fileName`, `storagePath`, `mimeType`, `sizeBytes`, `uploadedAt` — credential documents |
| `PasswordResetToken` | New | `id`, `userId` FK, `tokenHash`, `expiresAt`, `consumed`, `createdAt` — single-use, hashed, expiring |
| `Course.status` | Added (enum `DRAFT`/`PENDING`/`PUBLISHED`, default `PUBLISHED`) | Existing 3 courses become `PUBLISHED` |
| `Course.createdById` | Added (FK to `User`, nullable) | Legacy seeded courses have no owner |
| `Module` | New | `id`, `courseId` FK, `title`, `description`, `order` |
| `Lesson` | New | `id`, `moduleId` FK, `title`, `content`, `order`, `durationMinutes?` |
| `Question` / `Option` / `ExamResult` | Unchanged structurally | Exam stays course-level |

**Migration implications**: new PostgreSQL enum types and five new tables; two additive columns on `User`/`Course`. The migration is forward-only and non-destructive; existing course/questions/options/results and users are preserved. The hardcoded `server/src/data/courseInstructions.ts` is re-seeded as structured lessons (content preserved, not deleted).

### Target API surface (grouped by role)

**Public (no auth)**

- `POST /api/auth/register` — always creates `STUDENT`
- `POST /api/auth/login`, `POST /api/auth/logout`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- `GET /api/courses` — `PUBLISHED` only
- `GET /api/courses/:slug` — `PUBLISHED` only (now includes modules/lessons)
- `GET /api/courses/:slug/lessons` — published content
- `GET /api/courses/:slug/exam` — `PUBLISHED` only

**Student (auth, role `STUDENT`)**

- `GET /api/auth/me` (all roles)
- `GET /api/me/results`
- `POST /api/courses/:slug/exam/submit`
- `GET /api/me/dashboard` — progress, results, recommendations
- `POST /api/instructor/apply` — any student applies to become instructor

**Instructor (auth, role `INSTRUCTOR`; admin also authorized)**

- `POST /api/instructor/applications` — (re)apply
- `GET/POST/PUT/DELETE /api/instructor/courses` and `/api/instructor/courses/:id` — own content CRUD
- `POST/PUT/DELETE /api/instructor/courses/:id/modules[/:moduleId]`
- `POST/PUT/DELETE /api/instructor/courses/:id/modules/:moduleId/lessons[/:lessonId]`
- `POST/PUT/DELETE /api/instructor/courses/:id/questions[/:questionId]` (+ options)
- `POST /api/instructor/courses/:id/submit` — request publish (`DRAFT` → `PENDING`)
- `GET /api/instructor/dashboard` — own courses, statuses, stats

**Admin (auth, role `ADMIN`)**

- `GET /api/admin/instructor-applications` (filter by `status`)
- `POST /api/admin/instructor-applications/:id/approve`
- `POST /api/admin/instructor-applications/:id/reject`
- `GET /api/admin/courses?status=PENDING` — moderation queue
- `POST /api/admin/courses/:id/approve` (`PENDING` → `PUBLISHED`)
- `POST /api/admin/courses/:id/reject` (`PENDING` → `DRAFT`)
- `GET /api/admin/dashboard` — platform stats (users, courses, applications, results)
- `GET /api/admin/users` — replaces the current `GET /api/users` (now admin-only)
- `GET /api/admin/documents/:id` — protected credential document download

### Frontend scope

**New screens**: landing page (marketing-focused home), lesson player, instructor application form, admin moderation (applications + course queue + users), student/instructor/admin dashboards, and password reset (forgot + reset).

**Redesigned screens**: `Home` → premium landing; `Practicas` → modern catalog; `CourseDetail` → course page with lesson list; `Exam` → smoother with loading states; `Login`/`Registro` → premium validated forms; `Perfil` → enriched profile; global `Header`/`Footer`/`Layout` redesign. `client/src/api/mock.ts` is removed; all data comes from the API.

### Phasing

1. **Foundation & migration** — schema delta, additive migration, backfills, admin bootstrap via seed (not public registration), config/env (JWT secret, reset token, upload dir).
2. **Auth + RBAC + password reset** — `role` in tokens, `requireRole`, reset flow, role-aware existing endpoints.
3. **Content model + CRUD + approval** — modules/lessons, course status, instructor CRUD, instructor application + documents, admin approval.
4. **Dashboard APIs** — three role-scoped dashboard endpoints.
5. **Frontend redesign + new public/student screens** — landing, catalog, course, lessons, exam, reset, profile.
6. **Frontend dashboards + application + moderation** — the three dashboards and the moderation/application flows.
7. **Polish & verification** — animations, microinteractions, loading states, responsiveness, remove mock data, typecheck both projects.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `server/prisma/schema.prisma` | Modified | New enums, models, relations, fields |
| `server/prisma/migrations/` | New | Forward-only additive migration |
| `server/src/middleware/requireAuth.ts` | Modified | Expose role; keep JWT verify |
| `server/src/middleware/requireRole.ts` | New | Role-gating middleware |
| `server/src/controllers/auth.controller.ts` | Modified | Password reset, role in register |
| `server/src/controllers/course.controller.ts` | Modified | Status filtering, CRUD |
| `server/src/controllers/{instructor,admin,dashboard,document}.controller.ts` | New | New role-scoped controllers |
| `server/src/routes/*` | Modified/New | New role-grouped routes |
| `server/src/schemas/*` | New/Modified | Validation schemas (zod) |
| `server/src/config/env.ts` | Modified | Reset token, upload dir, SMTP config |
| `server/src/data/courseInstructions.ts` | Modified | Re-seeded as structured lessons |
| `server/package.json` | Modified | Upload/static deps (e.g. multer) |
| `client/src/pages/*` | New/Modified | New screens + redesign of existing |
| `client/src/components/*` | New/Modified | New UI primitives, loaders, skeletons |
| `client/src/api/*` | New/Modified | New modules; remove `mock.ts` |
| `client/src/contexts/AuthProvider.tsx` | Modified | Role-aware auth state |
| `client/src/routes/ProtectedRoute.tsx` | Modified | Role-gated routing |
| `client/src/App.tsx`, `client/src/index.css` | Modified | Routes + design-system tokens |
| `docs/api-contract.md` | Modified | Extended v2 endpoints (v1 preserved) |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Data loss during migration | Low | Forward-only additive migration with backfills; DB backup before apply; no destructive deltas |
| Credential documents exposed | Med | Admin-only download endpoint, storage outside webroot, no public URLs, type/size validation |
| Role authorization gaps | Med | `requireRole` on every protected route; per-endpoint verification checklist |
| No test runner (strict TDD off) | Med | Rely on `tsc` typecheck both projects + manual verification; document the verification checklist |
| Contract drift between client/server | Med | Extend `docs/api-contract.md` as v2, coordinate changes, never break v1 shapes |
| Email delivery unavailable in dev | Med | Dev-only reset-token return (or logged token); document the production SMTP path |
| Admin self-registration / escalation | Low | Registration hard-codes `STUDENT`; admin bootstrapped via seed only |
| Scope creep (redesign of all screens) | High | Phase-gated delivery; functional correctness before visual polish |

## Rollback Plan

- Migrations are additive and non-destructive: rollback = revert the offending commit and redeploy the prior build; the DB remains consistent because no data is dropped or renamed.
- For a broken migration specifically, restore the pre-migration database snapshot and `git revert` the migration commit.
- Backend and frontend deploy independently: reverting `client/` restores the previous UI without touching the API; reverting `server/` restores the v1 API (the extended contract is additive, so v1 clients keep working).
- Contract extension is versioned: the v2 endpoints are appended to `docs/api-contract.md`; v1 sections are left untouched and can be reverted independently.
- Admin bootstrap is seed-script-based and idempotent; re-running it never grants role escalation to public users.

## Dependencies

- Reachable PostgreSQL instance and `prisma migrate` access.
- Decision on credential-document storage backend: local protected directory vs. S3-compatible object storage (Render's filesystem is ephemeral — object storage preferred for production).
- Email delivery mechanism for password reset (SMTP) or an explicit dev-only token return strategy.
- Coordinated extension of the frozen API contract between backend and frontend agents.

## Success Criteria

- [ ] Existing 3 courses, their questions/options, and user exam results remain intact and publicly accessible.
- [ ] Roles are enforced: registration always yields `STUDENT`; admin cannot self-register; instructors require admin approval.
- [ ] Full course/module/lesson/exam CRUD works, and a course reaches `PUBLISHED` only after admin approval.
- [ ] The three dashboards return correct role-scoped data with no cross-role leakage.
- [ ] Password reset works end-to-end (forgot → token → reset).
- [ ] Credential documents are retrievable only by admins via the protected endpoint.
- [ ] The frontend contains no mock data; all screens are responsive with animations and loading states.
- [ ] `tsc` typecheck passes in both `client/` and `server/`.
