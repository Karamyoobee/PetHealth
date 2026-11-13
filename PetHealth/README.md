# Pet Health

Pet Health is a mobile app that helps pet owners keep their pet's health details in one place. Users can save records, set medicine reminders, prepare for vet visits, and download a pet health report.

## What the app can do

- Create an account with an email and password, or sign in with Google.
- Add one or more pets.
- Save vaccinations, symptoms, weight, vet visits, medicines, and reminders for each pet.
- Save clinic names, vet names, medicine names, purposes, and dosages to use again later for the same pet.
- Track when medicine has been given and set reminders.
- View a pet's timeline and weight changes.
- Use the weight flagging tool for supported breeds.
- Download a pet health report as a PDF.
- Ask the Health Assistant for general pet-care information or find nearby vets.
- Read the privacy policy and terms, or delete an account from the app.

Pet Health does not replace a veterinarian. For urgent symptoms or emergencies, contact a vet straight away.

## Project folders

```text
backend/     The Flask server, database code, reports, reminders, and Assistant
frontend/    The Expo and React Native mobile app
docs/        Project notes and API details
```

## What you need before starting

- Node.js and npm
- Python 3.11 or later
- A MongoDB Atlas database or local MongoDB database
- Android Studio and an Android phone or emulator

## Run the backend on your computer

Open PowerShell and run:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python -m flask --app app run --host 0.0.0.0 --port 5000
```

Open `backend/.env` and add your real values. Do not upload or commit this file.

```env
MONGODB_URI=mongodb+srv://username:password@cluster.example.mongodb.net/pet_health
MONGODB_DB=pet_health
MONGODB_CREATE_INDEXES=true
CORS_ORIGINS=http://localhost:8081
JWT_SECRET=use-a-long-random-value-in-production
JWT_EXPIRES_HOURS=168
GOOGLE_CLIENT_IDS=your-android-client-id.apps.googleusercontent.com
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash-lite
```

You can check that the backend is working by opening either link in a browser:

```text
http://localhost:5000/health
http://localhost:5000/health/db
```

## Run the mobile app on your computer or phone

Open a second PowerShell window and run:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run android
```

For an Android emulator, add this to `frontend/.env`:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
```

For a real Android phone connected with a USB cable, use this instead:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000
```

Turn on USB debugging on the phone before running `npm run android`. For Wi-Fi testing, use your computer's local IP address instead of `localhost`.

For the published app, use the hosted HTTPS backend address in `EXPO_PUBLIC_API_URL`. Never put database passwords, Gemini keys, email keys, or other backend secrets in `frontend/.env` or in a variable starting with `EXPO_PUBLIC_`.

## Set up Google sign-in

Google sign-in needs to be set up in Google Cloud and on the backend.

1. In Google Cloud, create an **Android** client.
2. Enter this package name: `pethealth.com`.
3. Copy the **App signing key certificate SHA-1** from Google Play Console: **Test and release → Setup → App integrity**.
4. Open **Advanced settings**, turn on **Custom URI scheme**, and save. The app uses `pethealth.com:/oauthredirect` to return after sign-in.
5. Put the Google client ID in `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` in `frontend/.env` and in Expo's Production environment variables.
6. Put the same client ID in `GOOGLE_CLIENT_IDS` in the backend environment variables. If the backend is on Render, save the change and wait for Render to redeploy it.
7. If the Google app is still in Testing, add every Google account that will sign in under **Google Auth Platform → Audience → Test users**.

You do not need a new AAB when you only change the SHA-1 or Custom URI setting in Google Cloud. You need a new AAB if you change the Google client ID in the frontend settings.

## Notifications

Medicine reminders are saved with the pet's records. The Android app asks for notification permission and uses scheduled alarms for local reminders.

Remote push notifications are optional. They need Expo, Firebase Cloud Messaging, and a separate backend worker. Add these only after you have set up those services:

```env
# frontend/.env
EXPO_PUBLIC_EAS_PROJECT_ID=your-expo-project-id
GOOGLE_SERVICES_FILE=./google-services.json

# backend/.env
EXPO_PUSH_ENABLED=true
EXPO_PROJECT_ID=your-expo-project-id
```

Start the remote reminder worker in another PowerShell window:

```powershell
cd backend
.\.venv\Scripts\python.exe -m flask --app app send-reminders --watch
```

Test reminders on a real Android phone, including while the app is closed. Battery saving settings, notification permission, and internet connection can affect notifications.

## Build an AAB for Google Play

Set the Production variables in Expo, then run:

```powershell
cd frontend
eas build --platform android --profile production
```

Expo creates an Android App Bundle file, called an `.aab` file. Upload it in Google Play Console under **Testing → Closed testing**. Every new upload needs a higher version code than the previous upload.

## Download and test the app from Google Play

Only Google accounts added in the Google Play Console **Testers** tab can use the Closed testing app.

1. Add the tester's Google email address to the tester list or Google Group.
2. Share the Closed testing opt-in link with the tester.
3. The tester opens the link using the same Google account and chooses **Become a tester**.
4. The tester downloads Pet Health from the [Google Play app page](https://play.google.com/store/apps/details?id=pethealth.com).
5. In the app, the tester can choose **Get Started** to register with an email and password. Google sign-in is optional.
6. When a new test version is approved, existing testers can update it from **Google Play Store → Manage apps & device → Updates**. They do not need the opt-in link again.

## Check the frontend before committing

Run this command before committing frontend changes:

```powershell
cd frontend
npm run typecheck
```

## Privacy links

The live backend has these public pages:

- Privacy policy: `/privacy`
- Account deletion help: `/delete-account`
- Terms and conditions: `/terms`

Deleting an account permanently removes the account and its pet records. It cannot be undone.

## Keep these files private

Do not commit `.env` files, Firebase service-account files, or `google-services.json` to Git.
