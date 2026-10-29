# Pet Health

Mobile app setup for the Pet Health project proposal.

This codebase is scoped to Karamjeet's core responsibilities:

- Google sign-in with JWT-backed sessions
- Multi-pet health records
- Vet visit log
- Medication and treatment tracker
- Reminder-ready data model
- Vet-ready PDF export
- AI-assisted pet health guidance through a backend Gemini integration

Symptom logging, weight tracking, predictive flags, and trends remain integration points for later project phases.

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
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash-lite
```

Keep `GEMINI_API_KEY` in `backend/.env`. Never put it in `frontend/.env` or use an `EXPO_PUBLIC_` variable for it, because values bundled into the mobile app can be extracted.

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

## Health Assistant

The Assistant screen sends the selected pet ID, question, and short chat history to the authenticated Flask endpoint. The backend confirms that the pet belongs to the signed-in user and builds a limited context from that pet's recent records. Owner profile fields are not included in the Gemini request, and the Gemini API key never leaves the backend. Free-text pet notes can still contain information entered by a user.

For a student demonstration, a Gemini free-tier key can be created in Google AI Studio. Free-tier prompts and responses may be used by Google to improve its products, so use synthetic pet records and do not submit personal, confidential, or sensitive information. Use a paid project and complete a privacy review before using real customer data.

