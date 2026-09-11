# API Reference

Base URL: `http://localhost:5000`

All feature routes use a development user header:

```http
X-User-Id: demo-user
```

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

Returns a vet-ready PDF with pet profile, vet visits, medication history, and reminders.
