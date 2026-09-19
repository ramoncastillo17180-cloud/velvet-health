# Course Management Specification

## Purpose

Defines the content model (course / module / lesson / exam) CRUD, the course status lifecycle (`DRAFT` / `PENDING` / `PUBLISHED`), and admin publish approval. Existing public course browsing, exam fetch, and server-side exam grading are conserved and extended — not broken.

## Requirements

### Requirement: Course status lifecycle

Course status MUST be one of `DRAFT`, `PENDING`, or `PUBLISHED`. The additive migration MUST backfill existing courses to `PUBLISHED`. Newly created instructor courses MUST default to `DRAFT`. A course MUST reach `PUBLISHED` only through admin approval.

#### Scenario: Existing courses backfilled to PUBLISHED

- GIVEN the migration runs against a database with existing courses
- WHEN the migration completes
- THEN every existing course has `status = PUBLISHED` and remains publicly visible

#### Scenario: New course defaults to DRAFT

- GIVEN an instructor creating a new course
- WHEN the course is created without an explicit status
- THEN the course has `status = DRAFT`

### Requirement: Public catalog shows only published courses

`GET /api/courses` MUST return only courses with `status = PUBLISHED`. `DRAFT` and `PENDING` courses MUST NOT appear in the response.

#### Scenario: Catalog filters by status

- GIVEN a mixture of `PUBLISHED`, `DRAFT`, and `PENDING` courses
- WHEN an unauthenticated client calls `GET /api/courses`
- THEN the response contains only `PUBLISHED` courses

### Requirement: Public course detail includes structured lessons

`GET /api/courses/:slug` MUST return only a `PUBLISHED` course and MUST include its modules and lessons. The system MUST return `404` for a `DRAFT`, `PENDING`, or unknown course.

#### Scenario: Published course detail

- GIVEN a `PUBLISHED` course with modules and lessons
- WHEN a client calls `GET /api/courses/:slug`
- THEN the response includes the course plus its ordered modules and lessons

#### Scenario: Draft course not publicly visible

- GIVEN a `DRAFT` course
- WHEN a client calls `GET /api/courses/:slug` for that course
- THEN the system responds `404`

### Requirement: Public lessons endpoint

`GET /api/courses/:slug/lessons` MUST return the published course's structured lesson content and MUST return `404` for a non-`PUBLISHED` or unknown course.

#### Scenario: Published lessons

- GIVEN a `PUBLISHED` course
- WHEN a client calls `GET /api/courses/:slug/lessons`
- THEN the system returns the ordered modules and lessons

### Requirement: Public exam endpoint

`GET /api/courses/:slug/exam` MUST return the exam questions for a `PUBLISHED` course only, WITHOUT the correct-answer flag. Grading remains server-side.

#### Scenario: Published exam without answers

- GIVEN a `PUBLISHED` course with questions
- WHEN a client calls `GET /api/courses/:slug/exam`
- THEN the response contains questions and options with no `isCorrect` signal

#### Scenario: Draft exam not public

- GIVEN a `DRAFT` course
- WHEN a client calls `GET /api/courses/:slug/exam`
- THEN the system responds `404`

### Requirement: Exam submission and server-side grading

`POST /api/courses/:slug/exam/submit` MUST require authentication, grade the submission server-side, and store an `ExamResult`. The conserved grading semantics MUST be preserved: the last submitted answer per question wins, and `passed` is determined by the course `passThreshold`.

#### Scenario: Exam submission graded

- GIVEN an authenticated student and a `PUBLISHED` course with questions
- WHEN the student submits answers
- THEN the system grades server-side, stores an `ExamResult`, and responds `{ score, passed, resultId }`

#### Scenario: Unauthenticated submission

- GIVEN no valid token
- WHEN a client submits exam answers
- THEN the system responds `401`

### Requirement: Instructor course CRUD

Instructors (and admins) MUST be able to create, read, update, and delete their own courses via the instructor endpoints. Each course MUST record its owner (`createdById`). Instructors MUST NOT modify or delete courses they do not own (respond `403`).

#### Scenario: Instructor creates a course

- GIVEN an authenticated `INSTRUCTOR`
- WHEN the instructor creates a course
- THEN the course is created with `createdById` set to the instructor and `status = DRAFT`

#### Scenario: Instructor updates own course

- GIVEN an authenticated `INSTRUCTOR` who owns a course
- WHEN the instructor updates that course
- THEN the system applies the update

#### Scenario: Instructor cannot modify another's course

- GIVEN an authenticated `INSTRUCTOR` who does not own a course
- WHEN the instructor attempts to update or delete that course
- THEN the system responds `403`

### Requirement: Module CRUD

Instructors (and admins) MUST be able to create, update, and delete modules within their own courses, preserving ordering via the module `order` field.

#### Scenario: Instructor manages modules

- GIVEN an authenticated `INSTRUCTOR` who owns a course
- WHEN the instructor creates, reorders, updates, or deletes a module
- THEN the system applies the change to that course's modules

#### Scenario: Non-owner module access

- GIVEN an authenticated `INSTRUCTOR` who does not own the course
- WHEN the instructor attempts to modify a module in that course
- THEN the system responds `403`

### Requirement: Lesson CRUD

Instructors (and admins) MUST be able to create, update, and delete lessons within their own modules, preserving ordering and the optional `durationMinutes`.

#### Scenario: Instructor manages lessons

- GIVEN an authenticated `INSTRUCTOR` who owns the course and its module
- WHEN the instructor creates, updates, reorders, or deletes a lesson
- THEN the system applies the change

### Requirement: Exam question CRUD

Instructors (and admins) MUST be able to create, update, and delete exam questions and their options within their own courses. Correct-answer flags (`isCorrect`) MUST remain server-side and MUST NOT be exposed to the public exam endpoint.

#### Scenario: Instructor manages questions

- GIVEN an authenticated `INSTRUCTOR` who owns a course
- WHEN the instructor creates, updates, or deletes a question and its options
- THEN the system applies the change

### Requirement: Request publication

`POST /api/instructor/courses/:id/submit` MUST allow an instructor to request publication, transitioning an owned course from `DRAFT` to `PENDING`.

#### Scenario: Submit for review

- GIVEN an authenticated `INSTRUCTOR` who owns a `DRAFT` course
- WHEN the instructor submits the course for publication
- THEN the course transitions to `PENDING`

#### Scenario: Submit a non-draft course

- GIVEN an owned course that is not `DRAFT`
- WHEN the instructor attempts to submit it for publication
- THEN the system responds `409`

### Requirement: Admin publish approval

`POST /api/admin/courses/:id/approve` MUST be admin-only and MUST transition a `PENDING` course to `PUBLISHED`. `POST /api/admin/courses/:id/reject` MUST transition a `PENDING` course to `DRAFT`. Approving or rejecting a non-`PENDING` course MUST return `409`.

#### Scenario: Admin approves a course

- GIVEN a `PENDING` course and an authenticated `ADMIN`
- WHEN the admin approves the course
- THEN the course transitions to `PUBLISHED`

#### Scenario: Admin rejects a course

- GIVEN a `PENDING` course and an authenticated `ADMIN`
- WHEN the admin rejects the course
- THEN the course transitions to `DRAFT`

#### Scenario: Approve/reject a non-pending course

- GIVEN a course that is `DRAFT` or `PUBLISHED`
- WHEN the admin attempts to approve or reject it
- THEN the system responds `409`

### Requirement: Admin moderation queue

`GET /api/admin/courses?status=PENDING` MUST be admin-only and MUST return the pending course moderation queue.

#### Scenario: Pending queue

- GIVEN courses in mixed statuses and an authenticated `ADMIN`
- WHEN the admin requests `GET /api/admin/courses?status=PENDING`
- THEN the system returns only `PENDING` courses

#### Scenario: Non-admin denied

- GIVEN an authenticated `INSTRUCTOR`
- WHEN the instructor requests the admin moderation queue
- THEN the system responds `403`
