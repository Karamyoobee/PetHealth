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

For a physical Android device connected by USB, use `EXPO_PUBLIC_API_URL=http://localhost:5000` in `frontend/.env`. Keep the backend running, connect the phone with USB debugging allowed, and run `npm run android` from `frontend`. This command automatically restores backend port 5000 forwarding when a device reconnects, while the Android command stays running. No separate `adb reverse` command is needed for the backend. If you close the terminal, start `npm run android` again. This is development-only setup; a release build should use the hosted HTTPS backend.

For testing over Wi-Fi instead of USB, use your laptop's local network IP instead of `10.0.2.2`.

## Phone notifications

Local notifications work with the existing app build and permission. Remote push delivery uses Expo Push Service and Android FCM. MongoDB remains the database.

To activate remote push:

1. Create or link an Expo/EAS project and a Firebase Android app using the existing package name `pethealth.com`.
2. Follow [Expo's FCM credentials instructions](https://docs.expo.dev/push-notifications/fcm-credentials/). Upload the private FCM service-account key to EAS. Keep it out of Git and the mobile bundle. The separate Firebase `google-services.json` app configuration is used when building Android.
3. In `frontend/.env`, set `EXPO_PUBLIC_EAS_PROJECT_ID` to the real project UUID and `GOOGLE_SERVICES_FILE` to the Firebase app configuration path, such as `./google-services.json`. Build and install the Android app with those settings. For an existing native Android directory, apply the Expo configuration plugins and review the native changes before rebuilding; JavaScript reload alone cannot apply Firebase configuration.
4. Set the same UUID as `EXPO_PROJECT_ID` in `backend/.env`. Set `EXPO_PUSH_ENABLED=true` when the worker and credentials are ready. Set `EXPO_ACCESS_TOKEN` only if enhanced push security is enabled in Expo; this token stays on the backend.
5. Run the API and this separate worker process from `backend`:

```powershell
.\.venv\Scripts\python.exe -m flask --app app send-reminders --watch
```

For deployment, run the worker as a supervised service alongside the HTTPS API. The worker checks every 30 seconds and keeps preparing future occurrences without waiting for the phone to open the app. It sends alerts 4 hours before, 1 hour before and at the scheduled time. Medication reminders stop at the end date. Snooze sends only the chosen follow-up alert.

Sign in once on the rebuilt phone app and allow notifications to register that installation. In push mode, local scheduled alerts are removed to avoid sending both versions. Sign-out unregisters that installation, including when its JWT has expired; if the phone is offline, sign-out asks the user to reconnect so registration can be stopped. Password reset invalidates earlier device registrations. With push disabled, the app continues using its existing limited local schedule.

Delivery depends on the server, Expo/FCM, connectivity and phone settings. Accepted Expo tickets mean queued delivery, not proof that a notification appeared. The worker checks receipts, disables invalid tokens and retries temporary failures for up to five minutes. A lost response after Expo accepts a message can still cause a duplicate on retry; exact-once delivery is not guaranteed. Phone delivery must be tested after credential setup, including the app closed, early alerts, Snooze, completion and sign-out.

## Authentication

Pet Health uses Google OAuth on the frontend. The app sends Google's ID token to `POST /api/auth/google`. The backend verifies the token, creates or updates the MongoDB user record, creates a JWT session, and returns that JWT to the app.

After sign-in, API requests must include:

```http
Authorization: Bearer <jwt>
```

## Health Assistant

The Assistant screen sends the selected pet ID, question, and short chat history to the authenticated Flask endpoint. The backend confirms that the pet belongs to the signed-in user and builds a limited context from that pet's recent records. Owner profile fields are not included in the Gemini request, and the Gemini API key never leaves the backend. Free-text pet notes can still contain information entered by a user.

For a student demonstration, a Gemini free-tier key can be created in Google AI Studio. Free-tier prompts and responses may be used by Google to improve its products, so use synthetic pet records and do not submit personal, confidential, or sensitive information. Use a paid project and complete a privacy review before using real customer data.

