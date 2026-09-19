# Authorization Specification

## Purpose

Defines the role model (`STUDENT` / `INSTRUCTOR` / `ADMIN`) and the role-based protection of routes and endpoints, including credential document access. Every protected endpoint composes `requireAuth` (identity) followed by `requireRole` (permission). Public endpoints remain public.

## Requirements

### Requirement: Role model with STUDENT default

The system MUST define exactly three roles: `STUDENT`, `INSTRUCTOR`, and `ADMIN`. Every user MUST have exactly one role. Newly registered users MUST default to `STUDENT`. The additive migration MUST backfill every existing user to `STUDENT`.

#### Scenario: Existing users backfilled

- GIVEN the migration runs against a database with existing users that have no role column
- WHEN the migration completes
- THEN every existing user has `role = STUDENT`

#### Scenario: New user defaults to STUDENT

- GIVEN a new registration
- WHEN the user is created
- THEN the user's role is `STUDENT` unless a later admin or approval flow explicitly changes it

### Requirement: Authentication middleware attaches identity and role

The `requireAuth` middleware MUST verify the bearer token, attach the authenticated user's id and role to the request, and return `401` when the token is missing, invalid, or expired.

#### Scenario: Valid token attaches identity

- GIVEN a valid bearer token carrying `sub` and `role`
- WHEN a protected route runs `requireAuth`
- THEN the request gains the authenticated user id and role

#### Scenario: Missing token

- GIVEN a protected route and a request with no `Authorization` header
- WHEN `requireAuth` runs
- THEN the system returns `401`

### Requirement: Role middleware denies unauthorized access

The `requireRole` middleware MUST return `403` when the authenticated user's role is not permitted, and MUST return `401` when the request is unauthenticated. The permitted roles for each endpoint MUST follow the role tiering defined by the API surface.

#### Scenario: Permitted role passes

- GIVEN an authenticated user whose role is allowed on an endpoint
- WHEN the request reaches `requireRole`
- THEN the request proceeds to the handler

#### Scenario: Forbidden role

- GIVEN an authenticated `STUDENT` requesting an admin-only endpoint
- WHEN `requireRole` runs
- THEN the system returns `403`

#### Scenario: Unauthenticated request

- GIVEN a role-protected endpoint and no valid token
- WHEN the request reaches `requireRole` without prior `requireAuth`
- THEN the system returns `401`

### Requirement: Instructor endpoints are authorized for instructor and admin

Endpoints under `/api/instructor/*` MUST be authorized for `INSTRUCTOR` and `ADMIN` only. A `STUDENT` MUST receive `403`.

#### Scenario: Admin accesses instructor endpoint

- GIVEN an authenticated `ADMIN`
- WHEN the admin calls an instructor endpoint
- THEN the request is authorized

#### Scenario: Student denied on instructor endpoint

- GIVEN an authenticated `STUDENT`
- WHEN the student calls an instructor endpoint
- THEN the system returns `403`

### Requirement: Admin endpoints are admin-only

Endpoints under `/api/admin/*` MUST be authorized for `ADMIN` only. `STUDENT` and `INSTRUCTOR` users MUST receive `403`.

#### Scenario: Instructor denied on admin endpoint

- GIVEN an authenticated `INSTRUCTOR`
- WHEN the instructor calls an admin endpoint
- THEN the system returns `403`

### Requirement: Public endpoints remain public

Course catalog, published course detail, published lessons, and published exam endpoints MUST remain accessible without authentication. The status filter (`PUBLISHED` only) MUST be enforced server-side regardless of auth.

#### Scenario: Anonymous catalog access

- GIVEN published courses exist
- WHEN an unauthenticated client calls `GET /api/courses`
- THEN the system returns only published courses

### Requirement: Credential documents are admin-only

Credential document content MUST be retrievable only through the admin-authorized endpoint (`GET /api/admin/documents/:id`). There MUST NOT be a public URL serving document content. Authenticated non-admin users MUST receive `403`; unauthenticated requests MUST receive `401`.

#### Scenario: Admin downloads document

- GIVEN an authenticated `ADMIN`
- WHEN the admin requests a document by id via the admin endpoint
- THEN the system returns the document content

#### Scenario: Instructor denied on document

- GIVEN an authenticated `INSTRUCTOR`
- WHEN the instructor requests a document via the admin endpoint
- THEN the system returns `403`

#### Scenario: Anonymous document request

- GIVEN no authentication
- WHEN a client requests a document
- THEN the system returns `401`

### Requirement: Admin bootstrap via seed only

The first `ADMIN` MUST be created through a seed script. The seed MUST be idempotent (re-running it never grants role escalation to public users). Public registration MUST never create an `ADMIN`.

#### Scenario: Idempotent seed

- GIVEN the admin seed has already run
- WHEN the seed runs again
- THEN no additional admin is created and no public user is escalated
