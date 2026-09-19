# LMS Frontend Specification

## Purpose

Defines the new screens, the premium redesign of existing screens, role-aware routing, and the removal of mock data. Every screen MUST render data from the API; no mock data source may remain.

## Requirements

### Requirement: Landing page

A new marketing-focused landing page MUST serve as the public home. It MUST surface the published course catalog and calls-to-action for registration and login.

#### Scenario: Anonymous visitor sees landing

- GIVEN an unauthenticated visitor
- WHEN the visitor opens the root route
- THEN the landing page renders marketing content and the published catalog from the API

### Requirement: Lesson player

A new lesson player MUST render a course's structured lessons (modules and lessons) and allow navigation between them.

#### Scenario: Student plays lessons

- GIVEN a published course with modules and lessons
- WHEN a user opens a lesson
- THEN the player renders that lesson's content and allows navigation to adjacent lessons

### Requirement: Instructor application form

A new screen MUST let a student submit an instructor application with professional data and credential document uploads, with upload validation surfaced to the user.

#### Scenario: Student submits application

- GIVEN an authenticated `STUDENT`
- WHEN the student fills in professional data and uploads valid documents
- THEN the application is submitted to the API and a confirmation state is shown

#### Scenario: Invalid upload surfaced

- GIVEN the student selects a disallowed file type or oversized file
- WHEN the student submits the application
- THEN the form shows a validation error and does not submit

### Requirement: Admin moderation screens

New screens MUST present the instructor-application review queue, the course publication queue, and the user list, driven by the admin APIs.

#### Scenario: Admin reviews applications

- GIVEN an authenticated `ADMIN`
- WHEN the admin opens the moderation screen
- THEN the pending applications are listed and the admin can approve or reject each

#### Scenario: Admin reviews course queue

- GIVEN an authenticated `ADMIN`
- WHEN the admin opens the course moderation queue
- THEN pending courses are listed and the admin can approve or reject each

### Requirement: Role-scoped dashboards

Three new dashboard screens (student, instructor, admin) MUST render their respective role-scoped API data, and the active dashboard MUST follow the authenticated user's role.

#### Scenario: Student dashboard screen

- GIVEN an authenticated `STUDENT`
- WHEN the student opens their dashboard
- THEN the student dashboard renders their progress, results, and recommendations

#### Scenario: Instructor dashboard screen

- GIVEN an authenticated `INSTRUCTOR`
- WHEN the instructor opens their dashboard
- THEN the instructor dashboard renders their own courses and stats

#### Scenario: Admin dashboard screen

- GIVEN an authenticated `ADMIN`
- WHEN the admin opens their dashboard
- THEN the admin dashboard renders platform statistics

### Requirement: Password reset screens

Forgot-password and reset-password screens MUST implement the token flow: request a reset by email, then submit the token and a new password.

#### Scenario: Forgot password request

- GIVEN a visitor on the forgot-password screen
- WHEN the visitor submits an email
- THEN the screen confirms a generic success regardless of whether the email exists

#### Scenario: Reset password

- GIVEN a visitor on the reset-password screen with a valid token
- WHEN the visitor submits a new password
- THEN the API resets the password and the user is directed to log in

### Requirement: Redesign existing screens

The existing screens MUST be redesigned with premium styling while preserving their functionality: `Home` becomes the premium landing, `Practicas` becomes the modern catalog, `CourseDetail` becomes a course page with a lesson list, `Exam` gains loading states, `Login`/`Registro` become premium validated forms, `Perfil` becomes an enriched profile, and the global `Header`/`Footer`/`Layout` are redesigned.

#### Scenario: Redesigned catalog

- GIVEN a visitor opens the catalog
- WHEN the catalog loads
- THEN the redesigned catalog renders published courses from the API

#### Scenario: Redesigned course page

- GIVEN a published course
- WHEN a user opens the course detail
- THEN the redesigned page renders the course plus its lesson list

#### Scenario: Exam loading state

- GIVEN a user opens the exam
- WHEN the exam questions are loading
- THEN a loading state is shown before the questions render

#### Scenario: Validated auth forms

- GIVEN a visitor on the login or registration screen
- WHEN the visitor submits invalid data
- THEN the form shows inline validation errors

### Requirement: Remove mock data

`client/src/api/mock.ts` MUST be removed. Every data-fetching path MUST call the API, and no component MUST read from a local mock source.

#### Scenario: All data from API

- GIVEN the frontend is running without `mock.ts`
- WHEN any screen loads data
- THEN the data originates from the API client, not a mock source

### Requirement: Role-aware routing

Protected routes MUST gate access by role. A user whose role is not permitted MUST be redirected (to login when unauthenticated, or to a forbidden/landing state when authenticated but unauthorized). The role MUST come from the authenticated session context.

#### Scenario: Unauthenticated redirect

- GIVEN an unauthenticated visitor navigating to a protected route
- WHEN the route resolves
- THEN the visitor is redirected to login

#### Scenario: Wrong-role redirect

- GIVEN an authenticated `STUDENT` navigating to an admin-only route
- WHEN the route resolves
- THEN the student is redirected to a forbidden or landing state

#### Scenario: Permitted role proceeds

- GIVEN an authenticated `ADMIN` navigating to an admin-only route
- WHEN the route resolves
- THEN the admin screen renders

### Requirement: Premium UX (animations, loading states, responsiveness)

All screens MUST be responsive. Every data-fetching screen MUST show a loading state while data is in flight, and MUST show an error state when a request fails. Animations and microinteractions SHOULD be applied consistently across the redesign.

#### Scenario: Responsive layout

- GIVEN the app is viewed at mobile, tablet, and desktop widths
- WHEN any screen renders
- THEN the layout is usable and legible at each width

#### Scenario: Loading and error states

- GIVEN a data-fetching screen
- WHEN the request is in flight or fails
- THEN a loading state or an error state is shown, respectively
