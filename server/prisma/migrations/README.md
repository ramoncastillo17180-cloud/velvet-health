# Migrations — baseline reconciliation

This repository had **no `prisma/migrations/` history** before this change. The
live database was most likely initialized with `prisma db push`, so it has no
`_prisma_migrations` table. That means the committed migration
`20260919000000_add_lms_models` cannot simply be `prisma migrate deploy`ed
against an existing populated database (Prisma would treat the whole schema as
"new" and try to recreate tables that already exist).

The migration is **forward-only and additive**: it only runs
`CREATE TYPE` / `CREATE TABLE` / `ALTER TABLE ... ADD COLUMN` /
`ADD CONSTRAINT`, plus two no-op backfill `UPDATE`s. It never drops or renames
anything, so existing courses, questions, options, exam results, and users
survive untouched.

Pick the recipe that matches your database state.

## Fresh (empty) database

A fresh database has no existing tables, so the schema can be materialized
directly and the additive migration recorded as a baseline:

```sh
# Option A — keep using db push (the original initialization path)
npx prisma db push          # creates the full schema, including the LMS delta
npx prisma migrate resolve --applied add_lms_models   # optional baseline record

# Option B — adopt Prisma Migrate going forward
npx prisma migrate deploy   # applies the committed full history
```

Either way, run the seed afterwards: `npm run prisma:seed`.

## Existing populated database (no `_prisma_migrations` table)

Because the database was created with `db push`, do **not** run
`prisma migrate deploy` directly. Instead, generate the true delta, review it,
apply it, then record the baseline:

```sh
# 1. Back up the database first (proposal rollback plan).
pg_dump "$DATABASE_URL" > backup-before-lms.sql

# 2. Generate the additive delta against the live database.
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > delta.sql

# 3. Review delta.sql: it must contain only CREATE TYPE/TABLE,
#    ALTER TABLE ... ADD COLUMN, ADD CONSTRAINT, and optional idempotent
#    UPDATE ... WHERE <col> IS NULL. No DROP, no RENAME.

# 4. Apply it.
npx prisma db execute --file delta.sql

# 5. Record the committed migration as applied WITHOUT re-running it.
npx prisma migrate resolve --applied add_lms_models
```

`delta.sql` and the committed `migration.sql` are equivalent for this additive
delta; `delta.sql` is regenerated from the live DB so it reflects that DB's
exact starting state, while `migration.sql` is the canonical full-schema
baseline for fresh databases.

## After the baseline

Once the baseline is recorded (fresh or populated), future schema changes use
the normal `npx prisma migrate dev` workflow, which now has a migration history
to diff against.
