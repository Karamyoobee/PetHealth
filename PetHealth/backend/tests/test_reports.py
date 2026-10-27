from datetime import datetime, timedelta, timezone
from io import BytesIO
from types import SimpleNamespace

import jwt
import pytest
from bson import ObjectId
from flask import Flask
from pypdf import PdfReader
from pymongo.errors import PyMongoError

from routes import reports as reports_route
from services.pdf_report import build_pet_report
from utils import auth as auth_utils


class FakeCursor(list):
    def sort(self, field, direction):
        return self


class FakeCollection:
    def __init__(self, documents=None):
        self.documents = documents or []
        self.queries = []

    def find_one(self, query):
        return next((doc for doc in self.documents if all(doc.get(key) == value for key, value in query.items())), None)

    def find(self, query):
        self.queries.append(query)
        return FakeCursor(doc for doc in self.documents if all(doc.get(key) == value for key, value in query.items()))


@pytest.fixture
def report_setup(monkeypatch):
    pet_id = ObjectId()
    other_id = ObjectId()
    db = SimpleNamespace(pets=FakeCollection([{
        "_id": pet_id, "userId": "owner", "name": "Bella", "species": "Dog",
        "age": 0, "weightKg": 0, "spayedNeutered": False,
    }]), auth_credentials=FakeCollection())
    for collection, content in {
        "vet_visits": {"clinicName": "Saved clinic", "notes": "Clinic notes"},
        "medications": {"name": "Saved medicine", "instructions": "Give with food", "doseLog": [{"status": "taken", "takenAt": "2026-10-26"}]},
        "reminders": {"title": "Saved reminder", "enabled": False},
        "symptoms": {"name": "Saved symptom", "notes": "Symptom notes"},
        "weight_entries": {"weightKg": 12.5, "notes": "Saved weigh-in"},
        "predictive_flags": {"title": "Saved flag", "message": "Review with vet", "resolved": False},
        "vaccinations": {"name": "Saved vaccine", "dueDate": "2026-10-26"},
    }.items():
        setattr(db, collection, FakeCollection([
            {"petId": pet_id, **content}, {"petId": other_id, "name": "PRIVATE OTHER PET"},
        ]))
    monkeypatch.setattr(reports_route, "mongo", SimpleNamespace(db=db))
    monkeypatch.setattr(auth_utils, "mongo", SimpleNamespace(db=db))
    app = Flask(__name__)
    app.config.update(JWT_SECRET="test-secret", JWT_ISSUER="pet-health")
    app.register_blueprint(reports_route.reports_bp)

    def headers(user_id="owner", expired=False):
        now = datetime.now(timezone.utc)
        token = jwt.encode({
            "iss": "pet-health", "sub": user_id,
            "exp": now + timedelta(minutes=-1 if expired else 10),
        }, "test-secret", algorithm="HS256")
        return {"Authorization": f"Bearer {token}"}

    return app.test_client(), db, pet_id, headers


def test_report_contains_saved_records_only_for_selected_pet(report_setup):
    client, _, pet_id, headers = report_setup
    response = client.get(f"/api/pets/{pet_id}/report.pdf", headers=headers())
    assert response.status_code == 200
    assert response.mimetype == "application/pdf"
    assert response.headers["Cache-Control"] == "no-store"
    assert "bella-health-report.pdf" in response.headers["Content-Disposition"]
    reader = PdfReader(BytesIO(response.data))
    text = "\n".join(page.extract_text() for page in reader.pages)
    for saved in ["Bella", "Saved clinic", "Clinic notes", "Saved medicine", "Give with food", "taken", "Saved reminder", "Saved symptom", "Saved weigh-in", "Saved flag", "Saved vaccine"]:
        assert saved in text
    assert "PRIVATE OTHER PET" not in text
    assert "Spayed/neutered: No" in text
    assert "Age (years): 0" in text
    assert "Weight (kg): 0" in text
    assert "Enabled: No" in text
    assert "Page 1" in text


@pytest.mark.parametrize("user_id,expired,status", [(None, False, 401), ("owner", True, 401), ("another-user", False, 404)])
def test_report_rejects_missing_expired_or_other_user_session(report_setup, user_id, expired, status):
    client, db, pet_id, headers = report_setup
    response = client.get(f"/api/pets/{pet_id}/report.pdf", headers=headers(user_id, expired) if user_id else {})
    assert response.status_code == status
    assert db.medications.queries == []


def test_report_rejects_invalid_and_missing_pet(report_setup):
    client, _, _, headers = report_setup
    for pet_id in ["invalid", str(ObjectId())]:
        response = client.get(f"/api/pets/{pet_id}/report.pdf", headers=headers())
        assert response.status_code == 404


def test_report_database_failure_is_retryable(report_setup, monkeypatch):
    client, db, pet_id, headers = report_setup

    def unavailable(query):
        raise PyMongoError("private database details")

    monkeypatch.setattr(db.vet_visits, "find", unavailable)
    response = client.get(f"/api/pets/{pet_id}/report.pdf", headers=headers())
    assert response.status_code == 503
    assert "private database details" not in response.json["error"]


def test_long_report_wraps_all_records_and_escapes_user_text():
    notes = ("Long notes <b>literal text</b> & observations. " * 120) + "FINAL NOTE MARKER"
    visits = [{"clinicName": f"Clinic {index}", "notes": notes} for index in range(5)]
    buffer = build_pet_report({"name": "Bella & Friends <3"}, visits, [], [])
    reader = PdfReader(buffer)
    assert len(reader.pages) > 3
    text = "\n".join(page.extract_text() for page in reader.pages)
    assert "Bella & Friends <3" in text
    assert text.count("FINAL NOTE MARKER") == 5
    assert "<b>literal text</b>" in text
    assert "Clinic 4" in text
    assert "No records saved." in text
    for index, page in enumerate(reader.pages, 1):
        assert f"Page {index}" in page.extract_text()
