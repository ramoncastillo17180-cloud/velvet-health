# Instructor Application Specification

## Purpose

Defines the instructor onboarding lifecycle: a student submits an application with professional data and credential documents, an admin reviews it, and approves or rejects it. Approval promotes the applicant to `INSTRUCTOR`. Credential documents are protected and retrievable only by admins.

## Requirements

### Requirement: Student submits an application

A `STUDENT` MUST be able to submit an instructor application via `POST /api/instructor/apply` (and re-apply via `POST /api/instructor/applications`). The application MUST carry the professional fields (name, profession, and related data reusing the existing `profesion`/`edad` fields) and MAY reference zero or more uploaded credential documents. The system MUST respond `201` on success, MUST reject non-applicable roles with `403`, and MUST return `409` when the user already has a `PENDING` application.

#### Scenario: Successful application

- GIVEN an authenticated `STUDENT` with no existing application
- WHEN the student submits an application with valid professional data
- THEN the system creates an `InstructorApplication` with `status = PENDING`
- AND responds `201`

#### Scenario: Duplicate pending application

- GIVEN an authenticated user who already has a `PENDING` application
- WHEN the user submits another application
- THEN the system responds `409`

#### Scenario: Non-student denied

- GIVEN an authenticated `ADMIN` (or a role not eligible to apply)
- WHEN the admin attempts to submit an application through the student apply endpoint
- THEN the system responds `403`

### Requirement: Re-apply after rejection

A user whose application was `REJECTED` MUST be allowed to submit a new application, which creates a fresh `PENDING` application. An `APPROVED` instructor's application is terminal and MUST NOT be resubmitted as `PENDING`.

#### Scenario: Re-apply after rejection

- GIVEN a user with a `REJECTED` application
- WHEN the user submits a new application
- THEN the system creates a new `PENDING` application

#### Scenario: Approved application is terminal

- GIVEN an `INSTRUCTOR` whose application is `APPROVED`
- WHEN the instructor attempts to re-apply
- THEN the system responds `409`

### Requirement: Credential document upload with validation

The system MUST accept credential document uploads associated with an application, validating the content type against an allowlist and enforcing a maximum size. It MUST store documents outside the web root in a protected directory (or object storage), and MUST respond `400` for an invalid type or an oversized upload.

#### Scenario: Valid document upload

- GIVEN an application being submitted
- WHEN a client uploads a document of an allowed type within the size limit
- THEN the system stores the document and creates a `Document` record (fileName, storagePath, mimeType, sizeBytes, uploadedAt)

#### Scenario: Invalid content type

- GIVEN an application being submitted
- WHEN a client uploads a document with a disallowed MIME type
- THEN the system responds `400` and stores nothing

#### Scenario: Oversized document

- GIVEN an application being submitted
- WHEN a client uploads a document exceeding the size limit
- THEN the system responds `400` and stores nothing

### Requirement: Credential documents are protected

Document content MUST be retrievable only via the admin-authorized download endpoint (`GET /api/admin/documents/:id`). The system MUST NOT expose a public URL for any document. (Enforced by the authorization capability.)

#### Scenario: Admin-only retrieval

- GIVEN a stored credential document
- WHEN an `ADMIN` requests it via the admin endpoint
- THEN the system returns the document content
- AND any non-admin request returns `403` (or `401` if unauthenticated)

### Requirement: Admin lists applications by status

`GET /api/admin/instructor-applications` MUST be admin-only and MUST support filtering by `status` (`PENDING`, `APPROVED`, `REJECTED`). The response MUST include applicant identity and document metadata (never document binary content).

#### Scenario: List pending applications

- GIVEN applications in mixed statuses
- WHEN an `ADMIN` requests `GET /api/admin/instructor-applications?status=PENDING`
- THEN the system returns only `PENDING` applications with applicant and document metadata

#### Scenario: Non-admin denied

- GIVEN an authenticated `INSTRUCTOR`
- WHEN the instructor requests the applications list
- THEN the system responds `403`

### Requirement: Admin approves an application

`POST /api/admin/instructor-applications/:id/approve` MUST be admin-only. On a `PENDING` application it MUST set `status = APPROVED`, promote the applicant's role to `INSTRUCTOR`, and record the reviewer (`reviewedById`) and `reviewNotes`. Approving a non-`PENDING` application MUST return `409`.

#### Scenario: Successful approval

- GIVEN a `PENDING` application and an authenticated `ADMIN`
- WHEN the admin approves the application
- THEN the application becomes `APPROVED`
- AND the applicant's `role` becomes `INSTRUCTOR`
- AND the reviewer is recorded

#### Scenario: Approving a resolved application

- GIVEN an application already `APPROVED` or `REJECTED`
- WHEN the admin attempts to approve it
- THEN the system responds `409`

### Requirement: Admin rejects an application

`POST /api/admin/instructor-applications/:id/reject` MUST be admin-only. On a `PENDING` application it MUST set `status = REJECTED`, require `reviewNotes`, leave the user's role as `STUDENT`, and record the reviewer. Rejecting a non-`PENDING` application MUST return `409`.

#### Scenario: Successful rejection

- GIVEN a `PENDING` application and an authenticated `ADMIN`
- WHEN the admin rejects the application with review notes
- THEN the application becomes `REJECTED`
- AND the applicant's role remains `STUDENT`

#### Scenario: Rejecting a resolved application

- GIVEN an application already `APPROVED` or `REJECTED`
- WHEN the admin attempts to reject it
- THEN the system responds `409`
