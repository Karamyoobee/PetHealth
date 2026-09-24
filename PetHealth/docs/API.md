# API Reference

Base URL: `http://localhost:5000`

All feature routes use a development user header:

```http
X-User-Id: demo-user
X-User-Name: Demo Owner
X-User-Email: demo@example.com
```

## Database Model

MongoDB Atlas shows each data type as a separate collection:

```text
pet_health
  users
  pets
  vet_visits
  medications
  reminders
  symptoms
  weight_entries
  predictive_flags
```

Owner records live in `users`. Pet records store `userId`, and pet health records store both `userId` and `petId`.

## Users / Owners

`GET /api/users`

Returns owner profiles.

`GET /api/users/me`

Returns the current owner profile. If it does not exist yet, the backend creates it from the development headers.

`PATCH /api/users/me`

```json
{
  "name": "Karam",
  "email": "karam@example.com",
  "phone": "021000000"
}
```

`GET /api/users/me/pets`

Returns pets belonging to the current owner.

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
  "title": "Give antibiotic",
  "scheduledFor": "2026-09-10T08:00:00Z",
  "repeat": "daily",
  "enabled": true
}
```

## PDF Export

`GET /api/pets/:petId/report.pdf`

Returns a vet-ready PDF with pet profile, vet visits, medication history, reminders, symptoms, weights, and predictive flags.

## Symptoms

`GET /api/pets/:petId/symptoms`

`POST /api/pets/:petId/symptoms`

```json
{
  "name": "Vomiting",
  "severity": "medium",
  "notes": "Twice after breakfast",
  "recordedAt": "2026-09-10T20:00:00Z"
}
```

## Weight Tracking

`GET /api/pets/:petId/weights`

`POST /api/pets/:petId/weights`

```json
{
  "weightKg": 27.5,
  "recordedAt": "2026-09-10T20:00:00Z",
  "notes": "Evening weigh-in"
}
```

## Predictive Flags

`GET /api/pets/:petId/predictive-flags`

`POST /api/pets/:petId/predictive-flags`

```json
{
  "type": "trend",
  "title": "Weight change",
  "message": "Weight dropped over the latest entries",
  "severity": "low",
  "createdAt": "2026-09-10T20:00:00Z",
  "resolved": false
}
```

## Summary / Trends

`GET /api/pets/:petId/summary`

Returns the pet profile, feature record counts, and the latest weight entry for dashboard/trend screens.

## Database Health

`GET /health/db`

Pings MongoDB and returns the configured database name when the backend can connect.
