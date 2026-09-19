# Tasks: LMS Transformation

> Backend-first, additive, contract-synced transformation of Velvet Health into a role-scoped LMS. Follows the 7-phase plan in `proposal.md` / `design.md`. Backend tasks touch `server/` only, frontend tasks touch `client/` only, contract tasks touch `docs/api-contract.md` only. No test runner exists (`strict_tdd: false`), so verification is `tsc` typecheck (both projects) + the manual checklist in Phase 7. Threat matrix is `N/A` for this change (no routing/shell/subprocess boundary) — no RED-test tasks.

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~5,000–6,500 (additions + deletions) across ~75 files |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | feature-branch-chain: PR 1 → PR 2 → PR 3 → PR 4 → PR 5 → PR 6 → PR 7 |
| Delivery strategy | single-pr (preflight) |
| Chain strategy | feature-branch-chain (recommended); `size-exception` required to honor single-pr |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

> **Why a decision is needed:** the preflight delivery strategy is `single-pr`, but this change is ~13× the 400-line review budget. A single PR can only proceed with an explicit `size:exception` (maintainer approval). Recommended instead: `feature-branch-chain` over the seven work units below. The team must pick one before `sdd-apply` starts any work.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Foundation & migration: schema delta, additive migration, seeds, env | PR 1 (base = feature/tracker) | `npm run typecheck` in `server/` (after `prisma generate`) | `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script` reviewed against existing rows; `prisma migrate resolve --applied` on a populated DB | `server/prisma/schema.prisma`, `server/prisma/migrations/`, `server/prisma/seed.ts`, `seed-admin.ts` — revert commit + redeploy; no data dropped/renamed |
| 2 | Auth + RBAC + password reset | PR 2 (base = PR 1) | `npm run typecheck` in `server/` | Manual: `EMAIL_MODE=console` forgot → reset → login; RBAC checklist for each route in gating map | `server/src/middleware/*`, `server/src/controllers/auth.controller.ts`, `server/src/routes/auth.routes.ts`, `server/src/schemas/auth.schema.ts`, `server/src/utils/tokens.ts` |
| 3 | Content model + CRUD + approval | PR 3 (base = PR 2) | `npm run typecheck` in `server/` | Manual E2E: instructor course/module/lesson/question CRUD → submit → admin approve/publish | `server/src/controllers/{course,instructor,admin,document}.controller.ts`, `server/src/routes/{course,instructor,admin}.routes.ts`, `server/src/lib/storage.ts`, `server/src/middleware/upload.ts` |
| 4 | Dashboard APIs + admin user list | PR 4 (base = PR 3) | `npm run typecheck` in `server/` | Manual: three dashboards return role-scoped data with no cross-role leakage | `server/src/controllers/{dashboard,me,user}.controller.ts`, `server/src/routes/{me,user}.routes.ts`, `server/src/app.ts` |
| 5 | Frontend redesign + public/student screens | PR 5 (base = PR 4) | `npm run build` (`tsc -b`) in `client/` | Manual: landing/catalog/course/lesson/exam/reset/profile render from API, responsive | `client/src/api/*`, `client/src/pages/*`, `client/src/components/*`, `client/src/contexts/*` |
| 6 | Frontend dashboards + application + moderation | PR 6 (base = PR 5) | `npm run build` (`tsc -b`) in `client/` | Manual: three dashboards + apply + moderation flows, role redirects | `client/src/api/{dashboard,instructor,admin}.ts`, `client/src/pages/*`, `client/src/routes/ProtectedRoute.tsx`, `client/src/App.tsx` |
| 7 | Polish, mock removal, contract sync, verification | PR 7 (base = PR 6) | `npm run typecheck` (server) + `npm run build` (client) | Manual: animations, loading/error/empty states, responsiveness; `docs/api-contract.md` v2 review | `client/src/api/mock.ts` (delete), `client/src/index.css`, `client/src/components/*`, `docs/api-contract.md` |

---

## Phase 1: Foundation & Migration

- [x] 1.1 Update `server/prisma/schema.prisma` with the data-model delta: add enums `Role`, `CourseStatus`, `InstructorApplicationStatus`; add models `Module`, `Lesson`, `InstructorApplication`, `Document`, `PasswordResetToken`; add `User.role` (default `STUDENT`), `User.tokenVersion` (default 0), and the relations `instructorApplications`, `coursesCreated`, `passwordResetTokens`, `reviewedApplications` (named `"ReviewedApplications"` on both ends); add `Course.status` (default `PUBLISHED`), `Course.createdById` (nullable FK, `onDelete: SetNull`), `Course.modules`. `Question`/`Option`/`ExamResult` stay unchanged.
  - Verify: `npx prisma generate` succeeds; `npx prisma validate` passes; schema matches the full shapes in `design.md` §Data Model.
- [x] 1.2 Author the forward-only additive migration `server/prisma/migrations/<timestamp>_add_lms_models/migration.sql` (`npx prisma migrate dev --name add_lms_models --create-only`). Ensure it creates the three enum types + five tables + two additive columns on `User`/`Course`, with `NOT NULL DEFAULT` backfills (`role='STUDENT'`, `status='PUBLISHED'`, `tokenVersion=0`) and the `Course_createdById_fkey` constraint (`ON DELETE SET NULL`). No `DROP`, no `RENAME`.
  - Verify: SQL contains only `CREATE TYPE/TABLE`, `ALTER TABLE ... ADD COLUMN`, `ADD CONSTRAINT`, and optional idempotent `UPDATE ... WHERE <col> IS NULL`; no destructive statements.
- [x] 1.3 Document and execute the one-time baseline reconciliation in `server/prisma/migrations/README.md` (new): because the repo has no `prisma/migrations/` history, for an existing populated DB generate the true delta with `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script > delta.sql`, review it, apply with `prisma db execute --file delta.sql`, then `npx prisma migrate resolve --applied add_lms_models`. For a fresh DB, the full-schema migration applies cleanly.
  - Verify: documented recipe; existing courses/questions/options/results and users survive untouched (backed up before apply per proposal rollback plan).
- [x] 1.4 Modify `server/prisma/seed.ts` to re-seed the three legacy courses as `status = PUBLISHED`, `createdById = null`, each with one `Module` (order 1) and one `Lesson` per instruction step, deriving content from the existing `server/src/data/courseInstructions.ts` (content preserved, not deleted). Keep the existing "only seed when courses table empty" guard.
  - Verify: after seed, each legacy course has `status=PUBLISHED`, `createdById=null`, and ≥1 module with ordered lessons whose content equals the original instruction strings.
- [x] 1.5 Create `server/prisma/seed-admin.ts` — idempotent admin bootstrap: reads `ADMIN_EMAIL`, `ADMIN_PASSWORD` (optional `ADMIN_NOMBRE`, `ADMIN_APELLIDOS`), upserts one `ADMIN` only if the email does not already exist, and never changes an existing user's role.
  - Verify: re-running the script never creates a second admin nor escalates a public user (authorization spec "idempotent seed" scenario).
- [x] 1.6 Modify `server/package.json` to add a `prisma:seed-admin` script (`node dist/prisma/seed-admin.js`); modify `server/src/config/env.ts` to add `jwtExpiresIn`, `resetTokenTtlMinutes`, `emailMode`/SMTP config, `uploadDir`, `maxUploadBytes`, `docStorage`, and S3 keys (`S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`); mirror them in `server/.env.example`; append `uploads/` to `server/.gitignore`.
  - Verify: `env.ts` typechecks; all new vars documented in `.env.example`; `server/uploads/` is ignored.

## Phase 2: Auth + RBAC + Password Reset

- [x] 2.1 Modify `server/src/middleware/requireAuth.ts` to an async middleware: verify signature/expiry, parse `sub`/`role`/`ver`, do one PK-indexed read (`select: { id, role, tokenVersion }`), reject `401` when token missing/invalid/expired, when `ver !== tokenVersion` (invalidated session), or when the user no longer exists; attach `req.userId` and `req.userRole` (current role refreshed from DB). Update `server/src/types/express.d.ts` to declare `userRole?: Role`.
  - Verify: valid token attaches id+role; missing/invalid/expired token → `401`; a token from a pre-reset session (`ver` mismatch) → `401`.
- [x] 2.2 Create `server/src/middleware/requireRole.ts` — `requireRole(...roles: Role[])` returning middleware: `401` if `req.userId`/`req.userRole` absent (requireAuth did not run), `403` if `req.userRole` not in the allow-list, else `next()`.
  - Verify: permitted role passes; forbidden role → `403`; unauthenticated → `401` (authorization spec scenarios).
- [x] 2.3 Create `server/src/utils/tokens.ts` — `generateResetToken()` (`crypto.randomBytes(32).toString('hex')`) and `hashResetToken(raw)` (SHA-256 hex). Add `resetPasswordSchema` and `forgotPasswordSchema` to `server/src/schemas/auth.schema.ts` (min password length 8).
  - Verify: token is 64 hex chars; hash is deterministic and matches `sha256` of the raw token; schema rejects short passwords.
- [x] 2.4 Modify `server/src/controllers/auth.controller.ts`: register always creates `role = STUDENT` (ignore any client-supplied `role`); login returns a JWT with payload `{ sub, role, ver }` (`expiresIn` from `env.jwtExpiresIn`); `me` returns full identity incl. `role`. Add `forgotPassword` handler (always `200` generic; for existing user, store `PasswordResetToken { tokenHash, expiresAt: now+15m, consumed:false }`, deliver via `EMAIL_MODE` — SMTP in prod, console/log in dev) and `resetPassword` handler (hash submitted token, match unconsumed+unexpired; on success bcrypt-hash new password, mark consumed, `tokenVersion += 1`).
  - Verify: registration ignores `role:"ADMIN"`; login payload carries `role`+`ver`; forgot is enumeration-safe; reset rejects invalid/expired/consumed token (`400`) and weak password (`400`, token not consumed); success invalidates prior sessions.
- [x] 2.5 Modify `server/src/routes/auth.routes.ts` to add `POST /forgot-password` and `POST /reset-password`; apply the `POST /api/instructor/applications` carve-out guard only in Phase 3, but ensure `/api/auth/*` routes remain as-is except the two new public routes.
  - Verify: new routes reachable without auth; existing register/login/logout/me unchanged.
- [x] 2.6 Apply the route gating map in `server/src/routes/*` and `server/src/app.ts` for the auth/me surfaces: `/api/auth/me` → `requireAuth`; `/api/me/results` and exam submit → `requireAuth` (any role); public `/api/courses*` reads remain unguarded (status filter enforced in controller, Phase 3).
  - Verify: `requireAuth` + `requireRole` composition matches the gating map; `401`/`403` behave per role.
- [x] 2.7 Contract: extend `docs/api-contract.md` with the v2 **public + auth** section — document `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, the `role` addition on register/login/me responses, the error-format table (including the new `FORBIDDEN` code), and the note that `GET /api/courses*` now filters `status = PUBLISHED`. Leave all v1 endpoint shapes byte-compatible.
  - Verify: v1 sections untouched; new endpoints documented with request/response examples and error codes.

## Phase 3: Content Model + CRUD + Approval

- [ ] 3.1 Modify `server/src/controllers/course.controller.ts`: filter `GET /api/courses` and `GET /api/courses/:slug` to `status = PUBLISHED`; include ordered `modules` (with `lessons`) in course detail while preserving the flattened `instructions: string[]` (derived from lesson content) for v1 backward compatibility; add `GET /api/courses/:slug/lessons` (published only); server-generate slugs (slugify + collision suffix).
  - Verify: catalog returns only published; draft/pending/unknown course detail → `404`; detail includes modules+lessons AND legacy `instructions`.
- [ ] 3.2 Modify `server/src/controllers/exam.controller.ts` to add the `PUBLISHED`-only guard on `GET /api/courses/:slug/exam` and `POST /api/courses/:slug/exam/submit`; preserve the conserved grading semantics (last submitted answer per question wins; `passed` via course `passThreshold`); ensure the public exam response never includes the `isCorrect` flag.
  - Verify: draft course exam → `404`; public exam omits `isCorrect`; grading unchanged for published courses.
- [ ] 3.3 Create `server/src/schemas/course.schema.ts` — zod schemas for course/module/lesson create+update and question+options create+update (enforce exactly one option `isCorrect: true` per question).
  - Verify: schema validates well-formed payloads and rejects malformed ones (missing fields, >1 correct option).
- [ ] 3.4 Create `server/src/controllers/instructor.controller.ts` — own-course CRUD (`GET/POST /api/instructor/courses`, `GET/PUT/DELETE /api/instructor/courses/:id`), module CRUD, lesson CRUD, question+options CRUD, and `POST /api/instructor/courses/:id/submit` (`DRAFT` → `PENDING`, else `409`). Enforce ownership server-side (`createdById` must equal `req.userId`; non-owner → `403`). New courses default `status = DRAFT`; `slug` generated server-side.
  - Verify: instructor creates `DRAFT` course with `createdById`; non-owner update/delete → `403`; submit transitions `DRAFT`→`PENDING`; submit non-draft → `409`.
- [ ] 3.5 Create `server/src/lib/storage.ts` — `DocumentStorage { save, open }` interface plus a `LocalStorage` implementation writing under `env.uploadDir` (default `./uploads/documents`, outside web root) with server-generated `UUID.ext` names (extension from allowlist, never user input). Scaffold an `S3Storage` adapter behind `DOCUMENT_STORAGE=local|s3` (S3 env keys already in Phase 1).
  - Verify: `save` writes to the upload dir with a UUID name and returns `{ storagePath, mimeType, sizeBytes }`; `open` returns a readable stream for a stored path.
- [ ] 3.6 Create `server/src/middleware/upload.ts` — multer config: destination under `env.uploadDir`, MIME allowlist (`application/pdf`, `image/jpeg`, `image/png`), max size `MAX_UPLOAD_BYTES` (5 MB), reject invalid type/size with `400 VALIDATION_ERROR`; add `multer` + `@types/multer` (and `file-type` if magic-byte sniffing adopted) to `server/package.json`.
  - Verify: allowed file accepted; disallowed type/oversized → `400` and nothing stored (instructor-application spec).
- [ ] 3.7 Create `server/src/schemas/instructor.schema.ts` (application form-field schema for parsed multipart fields) and implement the canonical `POST /api/instructor/applications` in `server/src/controllers/instructor.controller.ts`: multipart with `profesion` (required), `edad` (optional), `documents` (0..N files). Authorization = `requireAuth` + `requireRole(STUDENT, INSTRUCTOR)` (ADMIN → `403`); controller enforces lifecycle: existing `PENDING` → `409`; caller is `INSTRUCTOR`/has `APPROVED` → `409`; else transactionally update `User.profesion`/`edad`, create `InstructorApplication` (`PENDING`) + `Document` rows → `201`.
  - Verify: success `201`; duplicate pending `409`; ADMIN `403`; re-apply after rejection → new `201`; approved/instructor terminal → `409`. (`POST /api/instructor/apply` is NOT implemented — superseded, per design.)
- [ ] 3.8 Create `server/src/controllers/admin.controller.ts` — `GET /api/admin/instructor-applications?status=` (with applicant + document metadata, never binary), `POST .../:id/approve` (`PENDING`→`APPROVED`, promote `User.role → INSTRUCTOR`, record `reviewedById`/`reviewedAt`/`reviewNotes`; else `409`), `POST .../:id/reject` (`PENDING`→`REJECTED`, require `reviewNotes`, leave role `STUDENT`; else `409`/`400`), and `GET /api/admin/courses?status=PENDING` + `POST /api/admin/courses/:id/approve|reject` (`PENDING`→`PUBLISHED`/`DRAFT`, else `409`).
  - Verify: approval promotes role; rejection keeps `STUDENT`; resolved-application approve/reject → `409`; non-pending course approve/reject → `409`; queue returns only `PENDING`.
- [ ] 3.9 Create `server/src/controllers/document.controller.ts` — `GET /api/admin/documents/:id`: resolve `storagePath`, confirm containment within upload dir (path-traversal defense), stream with stored `Content-Type` + `Content-Disposition: attachment`; `404` missing, `403` non-admin, `401` unauthenticated. Create `server/src/routes/instructor.routes.ts` and `server/src/routes/admin.routes.ts`; modify `server/src/routes/course.routes.ts` (add `/lessons`); mount both routers in `server/src/app.ts` with the correct guards (`/api/instructor/*` → `requireRole(INSTRUCTOR, ADMIN)` with the `applications` POST carve-out `requireRole(STUDENT, INSTRUCTOR)`; `/api/admin/*` → `requireRole(ADMIN)`).
  - Verify: document download streams only to admin; non-admin `403`, anon `401`; route gating matches design §Route gating map.
- [ ] 3.10 Contract: extend `docs/api-contract.md` with the v2 **instructor + admin + document** sections — document the full instructor CRUD surface, the canonical `POST /api/instructor/applications` (and that `POST /api/instructor/apply` is superseded), admin application/course moderation endpoints, and `GET /api/admin/documents/:id` (binary). Include the `201`/`409`/`403`/`400` error behavior per design.
  - Verify: every Phase 3 endpoint has a documented shape + error table entry; v1 untouched.

## Phase 4: Dashboard APIs

- [ ] 4.1 Create `server/src/controllers/dashboard.controller.ts` — `getStudentDashboard` (progress: `coursesStarted`/`coursesCompleted`/`totalCourses`; self-scoped results; recommendations = published courses not yet passed) and shared aggregation helpers. Add `GET /api/me/dashboard` to `server/src/routes/me.routes.ts` (or delegate from `server/src/controllers/me.controller.ts`) gated `requireAuth` + `requireRole(STUDENT)`.
  - Verify: student dashboard returns own progress/results/recommendations only; no cross-user data; `ADMIN`/`INSTRUCTOR` → `403`.
- [ ] 4.2 Add `getInstructorDashboard` to `server/src/controllers/instructor.controller.ts` — own courses (all statuses) with `studentsCount`/stats (`totalCourses`, `draft`, `pending`, `published`, `totalStudents`, `totalResults`). Route `GET /api/instructor/dashboard` in `server/src/routes/instructor.routes.ts` gated `requireRole(INSTRUCTOR, ADMIN)`.
  - Verify: returns only the caller's courses/stats; `STUDENT` → `403`.
- [ ] 4.3 Add `getAdminDashboard` to `server/src/controllers/admin.controller.ts` — platform counts (`users`, `students`, `instructors`, `admins`, `courses`, `publishedCourses`, `pendingCourses`, `applications`, `pendingApplications`, `results`). Route `GET /api/admin/dashboard` in `server/src/routes/admin.routes.ts` gated `requireRole(ADMIN)`.
  - Verify: platform-wide aggregate counts; `INSTRUCTOR`/`STUDENT` → `403`.
- [ ] 4.4 Modify `server/src/controllers/user.controller.ts` to the admin user list shape (`role`, `createdAt` included); move it to `GET /api/admin/users` in `server/src/routes/admin.routes.ts`; delete `server/src/routes/user.routes.ts` and remove `app.use("/api/users", userRouter)` from `server/src/app.ts` (the single deliberate v1 removal — old path returns `404`).
  - Verify: `GET /api/admin/users` → admin-only full user list; `GET /api/users` → `404`; non-admin on `/api/admin/users` → `403`.
- [ ] 4.5 Contract: extend `docs/api-contract.md` with the v2 **dashboards + admin users** sections — `GET /api/me/dashboard`, `GET /api/instructor/dashboard`, `GET /api/admin/dashboard`, `GET /api/admin/users`, and the documented "breaking change (removal)" note that `GET /api/users` is replaced by `GET /api/admin/users`.
  - Verify: dashboard response shapes match design examples; removal noted in v2 section.

## Phase 5: Frontend Redesign + Public/Student Screens

- [ ] 5.1 Modify `client/src/api/types.ts` — add `Role` type, `Module`/`Lesson`/`InstructorApplication`/`Document`/dashboard types, and `role` on `AuthUser`/`User`. Modify `client/src/api/client.ts` — add `apiUpload` (multipart `FormData`) and `apiDownload` (blob → trigger download); keep `apiFetch` for JSON. Update `client/src/api/index.ts` exports.
  - Verify: types compile; upload/download helpers exported.
- [ ] 5.2 Modify `client/src/api/auth.ts` (add `forgotPassword`/`resetPassword`, remove mock fallback), `client/src/api/courses.ts` (add `getLessons`, remove mock fallback), `client/src/api/exam.ts` and `client/src/api/results.ts` (remove mock fallback). Surface `NetworkError`/`ApiError` to screens instead of returning mock data.
  - Verify: no `mock.*` imports remain in these modules; errors propagate.
- [ ] 5.3 Modify `client/src/contexts/AuthProvider.tsx` (and `client/src/contexts/auth-context.ts`, `client/src/hooks/useAuth.ts`) — `AuthUser` gains `role`; expose `isStudent`/`isInstructor`/`isAdmin` (or `hasRole`); hydrate via `getMe` and clear token on `401`.
  - Verify: `role` available in context; header/profile nav can derive role-appropriate links.
- [ ] 5.4 Create `client/src/hooks/useAsyncData.ts` — `useAsyncData(fetcher, deps)` returning `{ data, loading, error, reload }`, and shared UI primitives `client/src/components/Skeleton.tsx` (shimmer), `Spinner.tsx`, `EmptyState.tsx`, `ErrorState.tsx` (distinguishes `NetworkError` retry vs `ApiError` message).
  - Verify: hooks/components render correctly for loading/error/empty/success states.
- [ ] 5.5 Create the new public/student screens: `client/src/pages/Landing.tsx` (marketing home + published catalog + CTAs), `client/src/pages/LessonPlayer.tsx` (module/lesson navigation), and the password-reset screens `client/src/pages/ForgotPassword.tsx` + `client/src/pages/ResetPassword.tsx` (token via query). Wire routes in `client/src/App.tsx`.
  - Verify: landing shows published catalog from API; lesson player navigates adjacent lessons; reset flow submits email then token+password (generic success on forgot).
- [ ] 5.6 Redesign existing screens to premium styling while preserving function: `client/src/pages/Home.tsx` → premium landing, `client/src/pages/Practicas.tsx` → modern catalog, `client/src/pages/CourseDetail.tsx` → course page + lesson list, `client/src/pages/Exam.tsx` → loading states, `client/src/pages/Login.tsx`/`Registro.tsx` → premium validated forms, `client/src/pages/Perfil.tsx` → enriched profile. Redesign `client/src/components/Header.tsx`, `Footer.tsx`, `Layout.tsx`.
  - Verify: screens render from API; forms show inline validation; exam shows loading before questions.
- [ ] 5.7 Extend design-system tokens in `client/src/index.css` (Tailwind v4 `@theme`): status colors (`draft`/`pending`/`published`/`rejected`/`approved`), `.badge-role`/`.badge-status`, feedback colors (`danger`, `muted`), skeleton shimmer keyframes + `.skeleton`/`.skeleton-card`/`.skeleton-row`; keep brand tokens (`--color-primary`, `--color-accent`, fonts, radius, shadow).
  - Verify: tokens resolve; badges/skeletons render.

## Phase 6: Frontend Dashboards + Application + Moderation

- [ ] 6.1 Create `client/src/api/dashboard.ts` (`getStudentDashboard`, `getInstructorDashboard`, `getAdminDashboard`), `client/src/api/instructor.ts` (course/module/lesson/question CRUD, `submitForReview`, `submitApplication` multipart), and `client/src/api/admin.ts` (applications list/approve/reject, courses approve/reject, users, document download). Export from `client/src/api/index.ts`.
  - Verify: all modules compile; multipart upload and blob download paths wired.
- [ ] 6.2 Create the three dashboard screens: `client/src/pages/StudentDashboard.tsx`, `InstructorDashboard.tsx`, `AdminDashboard.tsx` — each renders its role-scoped API data with loading/error/empty states via `useAsyncData`.
  - Verify: student dashboard shows progress/results/recommendations; instructor shows own courses+stats; admin shows platform counts.
- [ ] 6.3 Create `client/src/pages/InstructorApplication.tsx` — student application form (professional data + credential upload) with upload validation surfaced (allowed type/size). Create the instructor course editor `client/src/pages/CourseEditor.tsx` (create + edit modules/lessons/questions + submit-for-review).
  - Verify: form shows validation errors and does not submit invalid uploads; editor drives CRUD + submit.
- [ ] 6.4 Create the admin moderation screens: `client/src/pages/AdminApplications.tsx` (application queue approve/reject), `AdminCourses.tsx` (course publish queue approve/reject), `AdminUsers.tsx` (user list), plus admin dashboard navigation.
  - Verify: pending applications/courses listed; approve/reject calls the admin APIs and reflects status.
- [ ] 6.5 Modify `client/src/routes/ProtectedRoute.tsx` to accept `roles?: Role[]`: no token → `Navigate to="/login"` (with `state.from`); hydrating → skeleton; token present but role not permitted → `Navigate to="/"`. Wire role-gated routes in `client/src/App.tsx` per the design route map (`/dashboard` STUDENT, `/aplicar-instructor` STUDENT, `/instructor`* INSTRUCTOR, `/admin`* ADMIN, `/perfil` any auth, `/cursos/:slug/examen` any auth).
  - Verify: unauthenticated → login; wrong role → landing; permitted role renders (lms-frontend role-aware routing scenarios).

## Phase 7: Polish & Verification

- [ ] 7.1 Delete `client/src/api/mock.ts`; confirm no remaining import or reference in `client/src/` (grep for `mock`); all data-fetching paths use the API client.
  - Verify: `rg "mock" client/src` returns nothing; app builds and renders from API.
- [ ] 7.2 Apply animations/microinteractions and loading/error/empty states consistently: reuse `PageTransition`; ensure every data-fetching screen shows skeleton→content or `ErrorState`/`EmptyState`; verify responsiveness at mobile/tablet/desktop widths.
  - Verify: manual review across the screens; no unhandled loading flash; layouts legible at 3 widths.
- [ ] 7.3 Final contract review of `docs/api-contract.md`: ensure the v2 section is complete and every endpoint implemented in Phases 2–4 is documented; confirm v1 sections are byte-compatible and the `GET /api/users` removal is recorded.
  - Verify: contract and implementation agree; no v1 shape drift.
- [ ] 7.4 Full verification pass: `npm run typecheck` in `server/` (after `prisma generate`) and `npm run build` (`tsc -b`) in `client/`; run `npx oxlint` in `client/`. Execute the manual RBAC/password-reset/instructor-lifecycle/document-security checklists from `design.md` §Testing Strategy.
  - Verify: both typechecks pass; oxlint clean; manual checklist items pass end-to-end.

---

### Acceptance Summary (map to proposal Success Criteria)

- Existing 3 courses + questions/options + results intact and public → 1.1–1.4, 3.1–3.2.
- Roles enforced (register→STUDENT, no self-admin, instructor needs approval) → 2.4, 3.7–3.8, 1.5.
- Full CRUD + publish-after-approval → 3.3–3.9.
- Three dashboards correct, no cross-role leakage → 4.1–4.4, 6.2.
- Password reset end-to-end → 2.3–2.5, 5.5.
- Documents admin-only → 3.5–3.6, 3.9.
- No mock data; responsive + animated → 7.1–7.2, 5.x, 6.x.
- `tsc` typecheck both projects → 7.4.
