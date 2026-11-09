import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")


class Config:
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/pet_health")
    MONGODB_DB = os.getenv("MONGODB_DB", "pet_health")
    MONGODB_CREATE_INDEXES = os.getenv("MONGODB_CREATE_INDEXES", "false").lower() == "true"
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
    JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-secret")
    JWT_ISSUER = os.getenv("JWT_ISSUER", "pet-health")
    JWT_EXPIRES_HOURS = int(os.getenv("JWT_EXPIRES_HOURS", "168"))
    GOOGLE_CLIENT_IDS = [
        value.strip()
        for value in os.getenv("GOOGLE_CLIENT_IDS", os.getenv("GOOGLE_CLIENT_ID", "")).split(",")
        if value.strip()
    ]
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()
    GEMINI_TIMEOUT_SECONDS = int(os.getenv("GEMINI_TIMEOUT_SECONDS", "30"))
    BREVO_API_KEY = os.getenv("BREVO_API_KEY", "").strip()
    BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "").strip()
    BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "Pet Health").strip()
    EXPO_PUSH_ENABLED = os.getenv("EXPO_PUSH_ENABLED", "false").lower() == "true"
    EXPO_PROJECT_ID = os.getenv("EXPO_PROJECT_ID", "").strip()
    EXPO_ACCESS_TOKEN = os.getenv("EXPO_ACCESS_TOKEN", "").strip()
