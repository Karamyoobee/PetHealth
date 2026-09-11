# Pet Health Profile

Mobile app setup for the Pet Health Profile project proposal.

This codebase is scoped to Karamjeet's responsibilities:

- Multi-pet support
- Vet visit log
- Medication and treatment tracker
- Push notification reminders
- Vet-ready PDF export

Florence's areas, such as symptom logging, weight tracking, predictive flagging, and trends, are intentionally left as future integration points.

## Structure

```text
backend/     Flask API, MongoDB Atlas integration, PDF report generation
frontend/    Expo React Native app for Karamjeet-owned flows
docs/        Setup notes and API reference
```

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
flask --app app run --debug --port 5000
```

Set `MONGODB_URI` in `backend/.env` to your MongoDB Atlas connection string.
Set `MONGODB_CREATE_INDEXES=true` after Atlas is reachable if you want the backend to create indexes on startup.

### Frontend

```bash
cd frontend
npm install
npm start
```

Set `EXPO_PUBLIC_API_URL` in `frontend/.env` if your Flask API is not running at `http://localhost:5000`.

## Authentication Note

The proposal calls for Google OAuth and JWT. This setup includes a simple development user header so Karamjeet's features can be built and tested now. Production Google sign-in can replace `X-User-Id` without changing the feature data model.
