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
  "idToken": "google-id-token"
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

Returns a vet-ready PDF for the selected pet.

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
