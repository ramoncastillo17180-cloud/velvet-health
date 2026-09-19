# Authentication Specification

## Purpose

Defines user registration, login, logout, current-user identity, session security, and password reset/recovery for Velvet Health. Registration is a public endpoint that ALWAYS produces a `STUDENT`; role escalation through public registration is impossible. Passwords are bcrypt-hashed and never returned by the API. Sessions are stateless JSON Web Tokens (JWTs) carrying the user identity and role.

## Requirements

### Requirement: Public registration always creates a STUDENT

The system MUST expose a public registration endpoint (`POST /api/auth/register`) that creates a user with `role = STUDENT` regardless of any role value submitted in the request body. The system MUST NOT accept, persist, or honor a client-supplied role. The system MUST validate the payload (`nombre`, `apellidos`, `correo`, `contraseña` with a minimum length of 8). The system MUST hash the password with bcrypt and MUST NOT return the password or its hash. The system MUST return `409` when the email is already registered.

#### Scenario: Successful registration

- GIVEN no user exists with `correo = "ana@example.com"`
- WHEN a client submits a valid registration body to `POST /api/auth/register`
- THEN the system creates a user with `role = STUDENT`
- AND responds `201` with the user object (including `role`, excluding `contraseña`)

#### Scenario: Duplicate email

- GIVEN a user already exists with `correo = "ana@example.com"`
- WHEN a client submits a registration body using the same `correo`
- THEN the system responds `409` with a conflict error and creates no new user

#### Scenario: Client-supplied role is ignored

- GIVEN a client submits a registration body that includes `role: "ADMIN"`
- WHEN the system processes the registration
- THEN the created user has `role = STUDENT`
- AND the submitted `role` value is not persisted or honored

#### Scenario: Invalid email or short password

- GIVEN a registration body with an invalid `correo` or a `contraseña` shorter than 8 characters
- WHEN the client submits to `POST /api/auth/register`
- THEN the system responds `400` with a validation error and creates no user

### Requirement: Login issues a role-bearing JWT

The system MUST verify credentials on `POST /api/auth/login` and, on success, return a signed JWT containing the subject claim (`sub`) and the user's current `role`. The token SHALL expire after 7 days. The system MUST return `401` with a generic error message for both unknown email and incorrect password (no user enumeration).

#### Scenario: Successful login

- GIVEN a registered user with `role = STUDENT` and a correct password
- WHEN the client submits valid credentials to `POST /api/auth/login`
- THEN the system responds `200` with a JWT whose payload includes `sub` and `role = "STUDENT"`
- AND returns the user identity (`id`, `nombre`, `correo`, `role`)

#### Scenario: Wrong password

- GIVEN a registered user
- WHEN the client submits the correct `correo` with an incorrect `contraseña`
- THEN the system responds `401` with a generic error and returns no token

#### Scenario: Unknown email

- GIVEN no user exists with the submitted `correo`
- WHEN the client submits login credentials
- THEN the system responds `401` with the same generic error as a wrong password

### Requirement: Logout is stateless

The system MUST expose `POST /api/auth/logout` returning `204` with no server-side mutation. The client is responsible for discarding the token.

#### Scenario: Logout

- GIVEN an authenticated client
- WHEN the client calls `POST /api/auth/logout`
- THEN the system responds `204`
- AND performs no server-side state change

### Requirement: Current-user endpoint returns identity and role

The system MUST expose `GET /api/auth/me` requiring a valid token, and MUST return the authenticated user's identity including `role`. The system MUST return `401` for a missing or invalid token and `404` if the user no longer exists.

#### Scenario: Authenticated current user

- GIVEN a valid bearer token for an existing user
- WHEN the client calls `GET /api/auth/me`
- THEN the system responds `200` with `{ user: { id, nombre, correo, role, ... } }`

#### Scenario: Missing token

- GIVEN a request to `GET /api/auth/me` without an `Authorization` header
- WHEN the system processes the request
- THEN the system responds `401`

### Requirement: Password reset request is enumeration-safe

The system MUST expose `POST /api/auth/forgot-password` accepting an email. It MUST return the same generic success response whether or not the email exists. For an existing user, it MUST create a single-use, expiring, hashed reset token and deliver it via the configured email channel (or, in development only, return/log the token per the configured strategy).

#### Scenario: Reset requested for existing user

- GIVEN a registered user with `correo = "ana@example.com"`
- WHEN the client submits that email to `POST /api/auth/forgot-password`
- THEN the system responds `200` with a generic success message
- AND creates a single-use, expiring, hashed `PasswordResetToken` for the user

#### Scenario: Reset requested for unknown email

- GIVEN no user exists with the submitted email
- WHEN the client submits that email to `POST /api/auth/forgot-password`
- THEN the system responds `200` with the same generic success message
- AND creates no token (no enumeration)

### Requirement: Password reset consumes a single-use token

The system MUST expose `POST /api/auth/reset-password` accepting a token and a new password. It MUST reject invalid, expired, or already-consumed tokens with `400`. On success it MUST hash the new password, mark the token consumed, and invalidate the user's prior sessions.

#### Scenario: Successful reset

- GIVEN a valid, unexpired, unconsumed reset token for a user
- WHEN the client submits that token and a valid new password (minimum 8 characters)
- THEN the system sets the user's password to the new value, hashed with bcrypt
- AND marks the token consumed
- AND responds `200`

#### Scenario: Invalid token

- GIVEN a reset token that does not match any stored token
- WHEN the client submits it to `POST /api/auth/reset-password`
- THEN the system responds `400` and does not change any password

#### Scenario: Expired token

- GIVEN a valid reset token whose `expiresAt` is in the past
- WHEN the client submits it to `POST /api/auth/reset-password`
- THEN the system responds `400` and does not change any password

#### Scenario: Reused (consumed) token

- GIVEN a reset token already marked `consumed`
- WHEN the client submits it again to `POST /api/auth/reset-password`
- THEN the system responds `400` and does not change any password

#### Scenario: Weak new password

- GIVEN a valid, unexpired reset token
- WHEN the client submits a new password shorter than 8 characters
- THEN the system responds `400` and does not consume the token

### Requirement: Sessions are secure

The system MUST sign JWTs with the configured secret and MUST verify them on every protected request. Expired or malformed tokens MUST be rejected with `401`. The role claim embedded in a valid token MUST be authoritative for authorization decisions.

#### Scenario: Expired token rejected

- GIVEN a token whose `exp` has passed
- WHEN the client calls any protected endpoint with that token
- THEN the system responds `401`

#### Scenario: Tampered token rejected

- GIVEN a token signed with a different secret or with a modified payload
- WHEN the client calls a protected endpoint with that token
- THEN the system responds `401`
