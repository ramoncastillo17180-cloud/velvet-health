# Dashboards Specification

## Purpose

Defines three role-scoped dashboard APIs — student, instructor, and admin — each returning only the data its role is entitled to see, with no cross-role or cross-user leakage.

## Requirements

### Requirement: Student dashboard

`GET /api/me/dashboard` MUST return the authenticated student's progress, exam results, and course recommendations, scoped to that user only. The system MUST return `403` for a request from a role that is not `STUDENT` (or otherwise ineligible for the student view).

#### Scenario: Student dashboard returns own data

- GIVEN an authenticated `STUDENT` with exam results
- WHEN the student calls `GET /api/me/dashboard`
- THEN the system returns that student's progress, results, and recommendations only

#### Scenario: No cross-user data

- GIVEN two students with distinct results
- WHEN student A calls the student dashboard
- THEN the response contains no data belonging to student B

#### Scenario: Non-student denied

- GIVEN an authenticated `ADMIN` requesting the student dashboard
- WHEN the admin calls `GET /api/me/dashboard`
- THEN the system responds `403`

### Requirement: Instructor dashboard

`GET /api/instructor/dashboard` MUST return the authenticated instructor's own courses, their statuses, and aggregate statistics scoped to that instructor. It MUST be authorized for `INSTRUCTOR` and `ADMIN`.

#### Scenario: Instructor sees own courses

- GIVEN an authenticated `INSTRUCTOR` who owns courses in various statuses
- WHEN the instructor calls `GET /api/instructor/dashboard`
- THEN the system returns that instructor's courses with their statuses and stats

#### Scenario: Student denied

- GIVEN an authenticated `STUDENT`
- WHEN the student calls the instructor dashboard
- THEN the system responds `403`

### Requirement: Admin dashboard

`GET /api/admin/dashboard` MUST return platform-level statistics (users, courses, applications, results). It MUST be authorized for `ADMIN` only.

#### Scenario: Admin platform stats

- GIVEN an authenticated `ADMIN`
- WHEN the admin calls `GET /api/admin/dashboard`
- THEN the system returns platform-wide aggregate counts (users, courses, applications, results)

#### Scenario: Non-admin denied

- GIVEN an authenticated `INSTRUCTOR`
- WHEN the instructor calls the admin dashboard
- THEN the system responds `403`

### Requirement: Admin user list replaces the generic user list

`GET /api/admin/users` MUST be admin-only and MUST return all users. The current `GET /api/users` endpoint MUST become admin-only (replaced by `GET /api/admin/users`). Non-admin requests MUST receive `403`.

#### Scenario: Admin lists users

- GIVEN an authenticated `ADMIN`
- WHEN the admin calls `GET /api/admin/users`
- THEN the system returns all users

#### Scenario: Non-admin denied on user list

- GIVEN an authenticated `STUDENT` or `INSTRUCTOR`
- WHEN the user calls the user-list endpoint
- THEN the system responds `403`

### Requirement: No cross-role leakage

Each dashboard MUST return only data scoped to the caller's role and identity. A student MUST NOT receive other users' results or platform statistics; an instructor MUST NOT receive platform-wide statistics; only an admin MUST receive platform-wide data.

#### Scenario: Role-scoped isolation

- GIVEN data belonging to multiple roles and users
- WHEN any role requests its own dashboard
- THEN the response contains only data that role is authorized to see
