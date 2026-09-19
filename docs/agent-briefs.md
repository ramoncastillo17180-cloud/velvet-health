# Velvet Health — Agent Briefs (Phase 4)

Coordination briefs for the two parallel agents. Both agents implement against the
frozen `docs/api-contract.md`.

## Shared rules

- Read and follow `docs/api-contract.md` exactly. Do not change it unilaterally.
- Work ONLY inside your own worktree. Never touch the other agent's directory.
- Conventional Commits, no AI attribution.
- Never commit credentials. Secrets go in `.env` (gitignored); commit `.env.example`.
- Keep the legacy code intact until integration is verified.

## Frontend agent

- **Worktree**: `worktrees/frontend` (branch `frontend`)
- **Target**: `client/` — React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion + React Router
- **Pages** (React Router):
  - Home — course selection (3 cards + "selected" sidebar)
  - Catalog (`/practicas`) — course cards with "Iniciar"
  - Course detail (`/cursos/:slug`) — data-driven, progress circle, instructions, "Realizar Examen"
  - Login, Register
  - Exam (`/cursos/:slug/examen`) — multiple-choice, submit to API
  - Results (`/perfil`) — exam history
- **Components**: `Header`/`Navbar` + `ProfileDropdown`, `Footer`, `CourseCard` (two variants), `ProgressCircle`, `InstructionsList`, `LoginForm`, `RegisterForm`, `ExamQuestion`, shared `Layout`.
- **API client**: `client/src/api/` — consume the shapes from the contract. Build against contract-shaped mocks until the backend is ready.
- **Identity to preserve**: green medical palette (`#2b8b61`, `#3cb371`, `#4CAF50`, `#a4e6b5`…), Playfair Display + Montserrat, decorative rotated squares, Font Awesome.
- **Assets**: copy the 4 images from `img/` into `client/public/images/`.

## Backend agent

- **Worktree**: `worktrees/backend` (branch `backend`)
- **Target**: `server/` — Node + Express + TypeScript + Prisma (PostgreSQL) + JWT + bcrypt + zod
- **Prisma models**: `User`, `Course`, `Question`, `Option`, `ExamResult` (see contract data shapes).
- **Seed**: 3 courses (`rcp`, `hemorragias`, `heimlich`) + questions/options drafted from `curso1.html`, `curso2.html`, `curso3.html`.
- **Endpoints**: implement exactly the endpoints in `docs/api-contract.md`.
- **Security**: never return `isCorrect` to the client; grade the exam server-side. Hash passwords with bcrypt. Validate with zod. Central error handler matching the contract error format.
- **Env**: `DATABASE_URL` in `.env` (gitignored); commit `.env.example`.

## Integration (Phase 5)

- Merge `frontend` and `backend` branches into `main`.
- Wire CORS, dev proxy, and env; run both apps and verify the full flow end-to-end.
