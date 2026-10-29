# API Reference

Base URL for Android emulator development:

```text
http://10.0.2.2:5000
```

Base URL on the backend machine:

```text
http://localhost:5000
```

## Authentication

Google sign-in creates the application session.

`POST /api/auth/google`

```json
{
  "idToken": "google-id-token",
  "allowRegistration": true
}
```

Success response:

```json
{
  "token": "jwt-session-token",
  "tokenType": "Bearer",
  "expiresAt": "2026-10-07T00:00:00+00:00",
  "user": {
    "userId": "google:...",
    "email": "user@gmail.com",
    "name": "User Name",
    "provider": "google"
  }
}
```

All protected routes require:

```http
Authorization: Bearer <jwt-session-token>
```

The default session lifetime is controlled by `JWT_EXPIRES_HOURS`; the current default is 168 hours, or 7 days.

After successful Google registration, verified manual registration, or either login method, the app saves the session and opens Home. At startup, it validates the saved token through `/api/users/me`. A network failure, timeout, or temporary server error keeps the saved token and shows Retry. Only HTTP 401 clears an expired, invalid, or revoked session and opens Welcome Back. The startup session check times out after 15 seconds; other requests allow 45 seconds. The Home greeting includes Sign Out, which removes the local token and cached user before opening Welcome Back.

The Welcome screen sends `allowRegistration: true`. Welcome Back sends `false`, so an unknown Google account must register from Welcome first. Google email verification and the allowed OAuth client IDs are checked on the backend.

### Manual registration

Welcome's Get Started button opens the manual registration form. Continue with Google remains an independent option. Manual registration collects name, email, password, and password confirmation, then verifies an emailed eight-digit OTP before activating the account and opening Home.

- `POST /api/auth/register/request-code`: `{ "name": "...", "email": "...", "password": "..." }`. Returns a verification message and `challengeId` for a new email. An email already registered through Google or email/password returns `409` with an instruction to sign in or use another email, without sending an OTP. Email checks ignore letter case and surrounding spaces. Verification also rejects an email registered while its OTP was pending; the app returns to the registration form and displays the same message.
- `POST /api/auth/register/verify`: `{ "email": "...", "challengeId": "...", "code": "12345678" }`. Returns the same authenticated session response as Google registration after successful email verification.

Before verification, `pending_registrations` holds the name, email, a salted password hash, a keyed OTP hash, and a ten-minute expiry. It has a TTL expiry index. No active user or session is created at the code-request step. Verification allows five attempts, consumes the OTP once, and creates a verified `users` profile with provider `password` and the matching hash in `auth_credentials`, linked by `userId`. The registration password is the login password; there is no separate password-setup step. Requesting a new registration code replaces the previous pending request. Registration and password-reset codes are separate and cannot be exchanged.

Google-only users continue to use Google. An email already registered through one method cannot be registered again through the other method; users are directed to their existing sign-in method, without silently linking accounts or changing existing passwords.

### Email and password login

Manual login is available for verified accounts that already have a Pet Health password. Users registered manually use their registration password. Google-only accounts without a password must use Continue with Google. Existing passwords from earlier versions are preserved; the removed Set Password flow can no longer create a new password for a Google-only account.

- `POST /api/auth/password/login`: `{ "email": "...", "password": "..." }`. Returns the same session response as Google login.
- `POST /api/auth/password/request-code`: `{ "email": "..." }`. Returns a generic message and `challengeId` whether or not an eligible account exists.
- `POST /api/auth/password/reset`: `{ "email": "...", "challengeId": "...", "code": "12345678", "password": "..." }`. Resets an existing password after code verification. Both requesting and consuming a reset code require an existing password hash. Old setup codes cannot create a password. The user then signs in normally.

New passwords must contain at least one special character (for example @, #, $ or !). There is no password-length minimum or maximum. Spaces alone do not satisfy the special-character requirement. Existing passwords remain usable for login. Passwords are stored as salted scrypt hashes in `auth_credentials`, keyed by `userId`. They are never stored in or returned with the user profile. Reset codes are stored as keyed hashes, expire after ten minutes, allow at most five verification attempts, and are single-use. Requesting a new code invalidates the previous code. A successful reset invalidates all older app sessions, including existing Google-created app sessions; Google sign-in remains available.

Registration, sign-in, and reset requests have database-backed attempt limits. `auth_limits` uses a TTL index when `MONGODB_CREATE_INDEXES=true`. The credentials expiry index is not a TTL index, so code expiry never deletes a saved password. Verified account email cannot be reassigned through profile edits.

### Password email configuration

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, and, when the server requires authentication, `SMTP_USERNAME` and `SMTP_PASSWORD` in `backend/.env`. Use a sender authorized by the chosen provider. Port 587 uses STARTTLS; for port 465, set `SMTP_USE_SSL=true`. TLS certificate verification is enabled. Restart the backend after configuration changes.

Code emails are sent in the background. Delivery failures are logged without email contents, passwords, or reset codes. If a delivery fails, the user can request another code. No email is sent in the automated tests; the sender is mocked. Without SMTP configuration, code requests return 503 and direct the user to Google login rather than claiming an email was sent. Never return codes through the API or put SMTP credentials in frontend environment variables.

## Home Daily Summary

`GET /api/home/today?date=2026-10-19&timezoneOffset=-780`

Requires a session token. The frontend sends its local date and JavaScript timezone offset in minutes.
The response contains `date` and `counts` for `vaccinations`, `medications`, and `vetVisits`, using only pets owned by the signed-in user.

- Medications: remaining doses today within the inclusive `startDate` / `endDate` range. Supports the form's Once a day, Twice a day, and Three times a day schedules, plus Daily. Taken dose logs for the local date reduce the count.
- Vet visits: records whose `appointmentDate` falls on the local date, excluding completed or cancelled visits.
- Vaccinations: records in `vaccinations` with a `petId` referencing the pet's MongoDB ObjectId and a `dueDate` of today (YYYY-MM-DD), excluding completed or cancelled records. An administered date alone is not a future vaccination schedule.

An empty day returns zero for all three counts. These cards display today's counts and do not navigate to another screen.

## Database Model

MongoDB Atlas collections:

```text
pet_health
  users
  sessions
  pets
  vet_visits
  medications
  reminders
  symptoms
  weight_entries
  predictive_flags
```

The `users` collection stores Google account identity and profile fields. Pet and health records are linked to the signed-in account by `userId`.

## Users / Owners

`GET /api/users`

Returns the signed-in owner profile as a one-item list.

`GET /api/users/me`

Returns the signed-in owner profile. If it does not exist yet, the backend creates it from the JWT session.

`PATCH /api/users/me`

```json
{
  "name": "Karam",
  "email": "karam@example.com",
  "phone": "021000000"
}
```

`GET /api/users/me/pets`

Returns pets belonging to the signed-in owner.

## Pets

`GET /api/pets`

Returns the signed-in user's pets.

`POST /api/pets`

```json
{
  "name": "Milo",
  "species": "Dog",
  "breed": "Labrador",
  "age": 4,
  "sex": "Male",
  "weightKg": 28,
  "spayedNeutered": true
}
```

`GET /api/pets/:petId`

`PATCH /api/pets/:petId`

`DELETE /api/pets/:petId`

## Vet Visits

`GET /api/pets/:petId/vet-visits`

`POST /api/pets/:petId/vet-visits`

```json
{
  "appointmentDate": "2026-09-10",
  "clinicName": "City Vet",
  "veterinarianName": "Dr Lee",
  "diagnosis": "Skin irritation",
  "treatment": "Medicated shampoo",
  "notes": "Review in two weeks",
  "followUpDate": "2026-09-24"
}
```

## Medications

`GET /api/pets/:petId/medications`

`POST /api/pets/:petId/medications`

```json
{
  "name": "Antibiotic",
  "dosage": "1 tablet",
  "instructions": "Give with food",
  "schedule": "Twice daily",
  "startDate": "2026-09-10",
  "endDate": "2026-09-17",
  "reminderTime": "08:00"
}
```

`PATCH /api/medications/:medicationId/doses`

```json
{
  "status": "taken",
  "takenAt": "2026-09-10T08:10:00Z"
}
```

## Reminders

`GET /api/pets/:petId/reminders`

`POST /api/pets/:petId/reminders`

```json
{
  "type": "medication",
  "title": "Give medication",
  "scheduledFor": "2026-09-10T08:00:00Z",
  "repeat": "daily",
  "enabled": true
}
```

## PDF Export

`GET /api/pets/:petId/report.pdf`

Requires the signed-in user's bearer token. Returns a PDF attachment for an owned pet, containing its saved profile, vet visits, medications and dose logs, reminders, vaccinations, symptoms, weights, and predictive flags. Empty sections are marked as having no saved records. Long records wrap across numbered pages. The response uses `Cache-Control: no-store`; another user's pet returns `404`, and a missing or expired session returns `401`.

In the app, open Home → Export Health Report (PDF), select a pet, and tap Export PDF. Android and iOS open the device share menu for saving or sharing the file. The web version downloads the PDF through an authenticated request. Temporary mobile report files are removed after the share menu closes. Export creates a document from existing records without changing the database.

Report tests use `backend/requirements-dev.txt` for the PDF text reader. Run `python -m pytest tests/test_reports.py` from `backend` and `node --test tests/reports.test.cjs` from `frontend`.

## Health Assistant

`POST /api/assistant/chat`

Requires the signed-in user's JWT and a backend `GEMINI_API_KEY`.

```json
{
  "petId": "selected-pet-id",
  "message": "What should I monitor before our vet appointment?",
  "history": [
    {
      "role": "assistant",
      "text": "What would you like to review?"
    }
  ]
}
```

Success response:

```json
{
  "message": "Generated general guidance for the selected pet.",
  "disclaimer": "AI guidance is general information and is not a veterinary diagnosis or treatment plan."
}
```

The backend limits message and history length, verifies pet ownership, and sends only selected pet context to Gemini. The Gemini key must never be placed in the Expo environment.

## Future Integration Endpoints

The backend currently includes endpoints for symptoms, weight entries, predictive flags, and pet summaries so later project phases can connect to the same data model:

```text
GET/POST /api/pets/:petId/symptoms
GET/POST /api/pets/:petId/weights
GET/POST /api/pets/:petId/predictive-flags
GET      /api/pets/:petId/summary
```

These should be treated as integration-ready backend endpoints until their frontend workflows are completed.

## Health Checks

`GET /health`

Returns basic API status.

`GET /health/db`

Pings MongoDB and returns the configured database name when the backend can connect.
