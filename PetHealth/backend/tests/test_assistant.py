from datetime import datetime, timedelta, timezone

import jwt
from bson import ObjectId
from flask import Flask

from routes import assistant as assistant_route


class FakeCursor:
    def __init__(self, documents):
        self.documents = documents

    def sort(self, _field, _direction):
        return self

    def limit(self, count):
        return self.documents[:count]


class FakeCollection:
    def __init__(self, documents=None):
        self.documents = documents or []

    def find_one(self, query):
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                return document
        return None

    def find(self, query):
        matches = [
            document
            for document in self.documents
            if all(document.get(key) == value for key, value in query.items())
        ]
        return FakeCursor(matches)


class FakeDatabase:
    def __init__(self, pet):
        self.auth_credentials = FakeCollection()
        self.pets = FakeCollection([pet])
        self.collections = {
            "symptoms": FakeCollection(),
            "medications": FakeCollection(),
            "vet_visits": FakeCollection(),
            "weight_entries": FakeCollection(),
        }

    def __getitem__(self, name):
        return self.collections[name]


class FakeGeminiResponse:
    status_code = 200
    ok = True

    @staticmethod
    def json():
        return {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"text": "Monitor appetite and energy, and contact your vet if either worsens."}
                        ]
                    }
                }
            ]
        }


def build_app(api_key="test-key"):
    app = Flask(__name__)
    app.config.update(
        JWT_SECRET="test-secret",
        JWT_ISSUER="pet-health",
        GEMINI_API_KEY=api_key,
        GEMINI_MODEL="gemini-test-model",
        GEMINI_TIMEOUT_SECONDS=5,
    )
    app.register_blueprint(assistant_route.assistant_bp)
    return app


def bearer_header(user_id):
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {
            "iss": "pet-health",
            "sub": user_id,
            "email": "owner@example.com",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=10)).timestamp()),
        },
        "test-secret",
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}


def test_clean_value_limits_record_text():
    assert assistant_route.clean_value("x" * 700) == "x" * 500


def test_chat_uses_owned_pet_context_and_returns_model_text(monkeypatch):
    pet_id = ObjectId()
    assistant_route.mongo.db = FakeDatabase(
        {
            "_id": pet_id,
            "userId": "user-1",
            "name": "Bella",
            "species": "Dog",
            "breed": "Labrador",
            "age": 4,
        }
    )
    captured_request = {}

    def fake_post(url, **kwargs):
        captured_request.update({"url": url, **kwargs})
        return FakeGeminiResponse()

    monkeypatch.setattr(assistant_route.requests, "post", fake_post)
    client = build_app().test_client()

    response = client.post(
        "/api/assistant/chat",
        headers=bearer_header("user-1"),
        json={"petId": str(pet_id), "message": "What should I monitor?", "history": []},
    )

    assert response.status_code == 200
    assert response.get_json()["message"].startswith("Monitor appetite")
    assert captured_request["headers"]["x-goog-api-key"] == "test-key"
    assert "owner@example.com" not in str(captured_request["json"])
    assert "Bella" in str(captured_request["json"])


def test_chat_reports_missing_backend_key(monkeypatch):
    pet_id = ObjectId()
    assistant_route.mongo.db = FakeDatabase(
        {"_id": pet_id, "userId": "user-1", "name": "Bella", "species": "Dog"}
    )
    client = build_app(api_key="").test_client()

    response = client.post(
        "/api/assistant/chat",
        headers=bearer_header("user-1"),
        json={"petId": str(pet_id), "message": "Hello", "history": []},
    )

    assert response.status_code == 503
    assert "GEMINI_API_KEY" in response.get_json()["error"]
