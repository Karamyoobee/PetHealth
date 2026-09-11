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
