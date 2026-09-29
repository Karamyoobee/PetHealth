# Pet Health

Mobile app setup for the Pet Health project proposal.

This codebase is scoped to Karamjeet's core responsibilities:

- Google sign-in with JWT-backed sessions
- Multi-pet health records
- Vet visit log
- Medication and treatment tracker
- Reminder-ready data model
- Vet-ready PDF export

Symptom logging, weight tracking, predictive flags, trends, and assistant-style guidance are kept as backend integration points for later project phases. They should not be presented as completed user-facing features until their frontend flows are connected.

## Structure

```text
backend/     Flask API, MongoDB Atlas integration, Google auth, JWT, PDF reports
frontend/    Expo React Native app for Pet Health
docs/        Setup notes and API reference
```

## Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m flask --app app run --host 0.0.0.0 --port 5000
```

Required backend environment values:

```env
MONGODB_URI=mongodb+srv://...
MONGODB_DB=pet_health
MONGODB_CREATE_INDEXES=true
JWT_SECRET=replace-this-for-production
JWT_EXPIRES_HOURS=168
GOOGLE_CLIENT_IDS=your-android-client-id.apps.googleusercontent.com
```

## Frontend

```bash
cd frontend
npm install
npm run android
```

For the Android emulator, use this in `frontend/.env`:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
```

For a physical Android device, use your laptop's local network IP instead of `10.0.2.2`.

## Authentication

Pet Health uses Google OAuth on the frontend. The app sends Google's ID token to `POST /api/auth/google`. The backend verifies the token, creates or updates the MongoDB user record, creates a JWT session, and returns that JWT to the app.

After sign-in, API requests must include:

```http
Authorization: Bearer <jwt>
```

