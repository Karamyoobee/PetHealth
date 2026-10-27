import copy
import re
from datetime import timedelta
from types import SimpleNamespace

import pytest
from bson import ObjectId
from flask import Flask, jsonify
from pymongo.errors import DuplicateKeyError
from werkzeug.security import check_password_hash

from routes import auth as auth_route
from services import auth_email
from utils import auth as auth_utils
from utils import users as user_utils


def matches(document, query):
    for key, value in query.items():
        if key == "$or":
            if not any(matches(document, option) for option in value):
                return False
            continue
        actual = document.get(key)
        if not isinstance(value, dict):
            if actual != value:
                return False
            continue
        for operator, expected in value.items():
            if operator == "$exists" and (key in document) != expected:
                return False
            if operator == "$in" and actual not in expected:
                return False
            if operator == "$gt" and (actual is None or actual <= expected):
                return False
            if operator == "$lt" and (actual is None or actual >= expected):
                return False
            if operator == "$lte" and (actual is None or actual > expected):
                return False
            if operator == "$regex" and (not isinstance(actual, str) or not re.search(expected, actual, re.I if value.get("$options") == "i" else 0)):
                return False
    return True


class FakeCollection:
    def __init__(self, documents=(), unique_email=False):
        self.documents = copy.deepcopy(list(documents))
        self.unique_email = unique_email

    def find_one(self, query):
        return next((copy.deepcopy(doc) for doc in self.documents if matches(doc, query)), None)

    def update_one(self, query, update, upsert=False):
        document = next((doc for doc in self.documents if matches(doc, query)), None)
        inserted = document is None
        if inserted:
            if not upsert:
                return SimpleNamespace(matched_count=0)
            document = {key: value for key, value in query.items() if not isinstance(value, dict)}
            document.setdefault("_id", ObjectId())
            self.documents.append(document)
            document.update(copy.deepcopy(update.get("$setOnInsert", {})))
        document.update(copy.deepcopy(update.get("$set", {})))
        for key, value in update.get("$inc", {}).items():
            document[key] = document.get(key, 0) + value
        for key in update.get("$unset", {}):
            document.pop(key, None)
        return SimpleNamespace(matched_count=0 if inserted else 1)

    def find_one_and_update(self, query, update, upsert=False, **kwargs):
        document = self.find_one(query)
        if document is None and not upsert:
            return None
        self.update_one(query, update, upsert=upsert)
        return self.find_one({"_id": document["_id"] if document else query["_id"]})

    def insert_one(self, document):
        if any(doc.get("_id") == document.get("_id") for doc in self.documents if document.get("_id") is not None):
            raise DuplicateKeyError("Duplicate id")
        if self.unique_email and document.get("email") and any(doc.get("email") == document["email"] for doc in self.documents):
            raise DuplicateKeyError("Duplicate email")
        self.documents.append(copy.deepcopy(document))

    def delete_one(self, query):
        for index, document in enumerate(self.documents):
            if matches(document, query):
                del self.documents[index]
                return

    def delete_many(self, query):
        self.documents[:] = [doc for doc in self.documents if not matches(doc, query)]


@pytest.fixture
def auth_setup(monkeypatch):
    user = {
        "_id": ObjectId(), "userId": "google:owner", "email": "owner@example.com",
        "provider": "google", "emailVerified": True, "googleSubject": "owner", "name": "Owner",
    }
    db = SimpleNamespace(
        users=FakeCollection([user], unique_email=True), auth_credentials=FakeCollection([{
            "_id": user["userId"], "passwordHash": auth_route.DUMMY_PASSWORD_HASH, "authVersion": 0,
        }]),
        pending_registrations=FakeCollection(),
        auth_limits=FakeCollection(), sessions=FakeCollection(),
    )
    fake_mongo = SimpleNamespace(db=db)
    monkeypatch.setattr(auth_route, "mongo", fake_mongo)
    monkeypatch.setattr(auth_utils, "mongo", fake_mongo)
    monkeypatch.setattr(user_utils, "mongo", fake_mongo)
    emails = []
    monkeypatch.setattr(auth_route, "queue_password_email", lambda email, code=None: emails.append((email, code)))
    monkeypatch.setattr(auth_route, "queue_registration_email", lambda email, code: emails.append((email, code)))
    app = Flask(__name__)
    app.config.update(
        TESTING=True, JWT_SECRET="test-secret", JWT_ISSUER="pet-health", JWT_EXPIRES_HOURS=1,
        GOOGLE_CLIENT_IDS=["allowed-client"], SMTP_HOST="smtp.example.com", SMTP_FROM="app@example.com",
        SMTP_PORT=587, SMTP_USE_SSL=False, SMTP_USERNAME="app-user", SMTP_PASSWORD="test-smtp-password",
    )
    app.register_blueprint(auth_route.auth_bp)

    @app.get("/protected")
    def protected():
        return jsonify({"userId": auth_utils.current_user_id()})

    @app.patch("/profile")
    def profile():
        from flask import request
        user_utils.ensure_current_user(request.get_json())
        return jsonify({"ok": True})

    return app, app.test_client(), db, emails, user


PASSWORD = "a separate pet health password"


def request_code(client, email="owner@example.com"):
    response = client.post("/api/auth/password/request-code", json={"email": email})
    assert response.status_code == 200
    return response.json["challengeId"]


def save_password(client, email, challenge_id, code, password=PASSWORD):
    return client.post("/api/auth/password/reset", json={
        "email": email, "challengeId": challenge_id, "code": code, "password": password,
    })


def test_reset_login_hashing_and_single_use_code(auth_setup):
    app, client, db, emails, user = auth_setup
    with app.app_context():
        old_token, _ = auth_utils.create_session_token(user)
    challenge_id = request_code(client)
    code = emails[0][1]
    assert code not in str(db.auth_credentials.documents)
    assert "code" not in client.post("/api/auth/password/request-code", json={"email": "unknown@example.com"}).json
    assert save_password(client, "owner@example.com", challenge_id, code).status_code == 200
    credential = db.auth_credentials.documents[0]
    assert credential["passwordHash"] != PASSWORD
    assert credential["passwordHash"].startswith("scrypt:")
    assert check_password_hash(credential["passwordHash"], PASSWORD)
    assert "resetCodeHash" not in credential
    assert save_password(client, "owner@example.com", challenge_id, code).status_code == 400
    assert client.get("/protected", headers={"Authorization": f"Bearer {old_token}"}).status_code == 401

    response = client.post("/api/auth/password/login", json={"email": " OWNER@EXAMPLE.COM ", "password": PASSWORD})
    assert response.status_code == 200
    assert response.json["user"]["userId"] == user["userId"]
    assert "passwordHash" not in str(response.json)
    assert "resetCodeHash" not in str(response.json)
    assert len(db.users.documents) == 1
    assert client.get("/protected", headers={"Authorization": f"Bearer {response.json['token']}"}).status_code == 200


def test_unknown_and_unverified_accounts_cannot_reset_password(auth_setup):
    _, client, db, emails, _ = auth_setup
    db.users.documents[0]["emailVerified"] = False
    first = client.post("/api/auth/password/request-code", json={"email": "owner@example.com"})
    second = client.post("/api/auth/password/request-code", json={"email": "unknown@example.com"})
    assert first.status_code == second.status_code == 200
    assert first.json["message"] == second.json["message"]
    assert emails == []
    assert db.auth_credentials.documents[0]["passwordHash"] == auth_route.DUMMY_PASSWORD_HASH
    assert save_password(client, "unknown@example.com", second.json["challengeId"], "12345678").status_code == 400


def test_expired_code_cannot_change_password(auth_setup):
    _, client, db, emails, _ = auth_setup
    challenge_id = request_code(client)
    db.auth_credentials.documents[0]["resetExpiresAt"] = auth_route.utc_now() - timedelta(seconds=1)
    assert save_password(client, "owner@example.com", challenge_id, emails[0][1]).status_code == 400
    assert db.auth_credentials.documents[0]["passwordHash"] == auth_route.DUMMY_PASSWORD_HASH


def test_code_attempt_limit(auth_setup):
    _, client, db, emails, _ = auth_setup
    challenge_id = request_code(client)
    wrong_code = "00000000" if emails[0][1] != "00000000" else "11111111"
    for _ in range(5):
        assert save_password(client, "owner@example.com", challenge_id, wrong_code).status_code == 400
    assert save_password(client, "owner@example.com", challenge_id, emails[0][1]).status_code == 400
    assert db.auth_credentials.documents[0]["passwordHash"] == auth_route.DUMMY_PASSWORD_HASH


def test_new_code_invalidates_previous_code(auth_setup):
    _, client, _, emails, _ = auth_setup
    first = request_code(client)
    first_code = emails[0][1]
    second = request_code(client)
    assert first != second
    assert save_password(client, "owner@example.com", first, first_code).status_code == 400
    assert save_password(client, "owner@example.com", second, emails[1][1]).status_code == 200


def test_reset_request_rate_limit(auth_setup):
    _, client, _, _, _ = auth_setup
    for _ in range(3):
        request_code(client)
    assert client.post("/api/auth/password/request-code", json={"email": "owner@example.com"}).status_code == 429


def test_wrong_password_and_unknown_email_have_same_error(auth_setup):
    _, client, _, _, _ = auth_setup
    first = client.post("/api/auth/password/login", json={"email": "owner@example.com", "password": "wrong"})
    second = client.post("/api/auth/password/login", json={"email": "unknown@example.com", "password": "wrong"})
    assert first.status_code == second.status_code == 401
    assert first.json == second.json
    for _ in range(9):
        client.post("/api/auth/password/login", json={"email": "owner@example.com", "password": "wrong"})
    assert client.post("/api/auth/password/login", json={"email": "owner@example.com", "password": "wrong"}).status_code == 429


def test_password_policy_does_not_consume_valid_code(auth_setup):
    _, client, _, emails, _ = auth_setup
    challenge_id = request_code(client)
    code = emails[0][1]
    assert save_password(client, "owner@example.com", challenge_id, code, password="short").status_code == 400
    assert save_password(client, "owner@example.com", challenge_id, code).status_code == 200


def test_missing_email_config_does_not_claim_to_send_code(auth_setup):
    app, client, db, emails, _ = auth_setup
    app.config["SMTP_HOST"] = ""
    response = client.post("/api/auth/password/request-code", json={"email": "owner@example.com"})
    assert response.status_code == 503
    assert "Continue with Google" in response.json["error"]
    assert db.auth_credentials.documents[0]["passwordHash"] == auth_route.DUMMY_PASSWORD_HASH
    assert emails == []


def test_reset_code_cannot_be_used_for_another_account(auth_setup):
    _, client, _, emails, _ = auth_setup
    challenge_id = request_code(client)
    assert save_password(client, "other@example.com", challenge_id, emails[0][1]).status_code == 400


def test_google_registration_only_allowed_from_welcome(auth_setup, monkeypatch):
    _, client, db, _, _ = auth_setup
    claims = {"aud": "allowed-client", "sub": "new", "email": "new@example.com", "email_verified": True}
    monkeypatch.setattr(auth_route.id_token, "verify_oauth2_token", lambda *args: claims)
    assert client.post("/api/auth/google", json={"idToken": "token", "allowRegistration": False}).status_code == 403
    assert len(db.users.documents) == 1
    response = client.post("/api/auth/google", json={"idToken": "token", "allowRegistration": True})
    assert response.status_code == 200
    assert response.json["user"]["googleEmail"] == "new@example.com"
    assert len(db.users.documents) == 2


@pytest.mark.parametrize("claim,value", [("email_verified", False), ("aud", "another-app")])
def test_google_claim_validation(auth_setup, monkeypatch, claim, value):
    _, client, _, _, _ = auth_setup
    claims = {"aud": "allowed-client", "sub": "owner", "email": "owner@example.com", "email_verified": True}
    claims[claim] = value
    monkeypatch.setattr(auth_route.id_token, "verify_oauth2_token", lambda *args: claims)
    assert client.post("/api/auth/google", json={"idToken": "token", "allowRegistration": True}).status_code == 401


def test_google_email_cannot_be_reassigned_from_profile(auth_setup):
    app, client, db, _, user = auth_setup
    with app.app_context():
        token, _ = auth_utils.create_session_token(user)
    response = client.patch("/profile", json={"email": "attacker@example.com"}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 400
    assert db.users.documents[0]["email"] == "owner@example.com"


def test_password_email_uses_tls_and_never_contains_password(auth_setup, monkeypatch):
    app, _, _, _, _ = auth_setup
    events = []

    class FakeSMTP:
        def __init__(self, *args, **kwargs):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def starttls(self, **kwargs):
            events.append("tls")
        def login(self, *args):
            events.append("login")
        def send_message(self, message):
            events.append(message)

    monkeypatch.setattr(auth_email.smtplib, "SMTP", FakeSMTP)
    auth_email.send_password_email(app, "owner@example.com", "12345678")
    assert events[:2] == ["tls", "login"]
    assert "12345678" in events[2].get_content()
    assert PASSWORD not in events[2].get_content()


def register_code(client, email="new@example.com", password=PASSWORD):
    return client.post("/api/auth/register/request-code", json={
        "name": "New Owner", "email": email, "password": password,
    })


def verify_code(client, challenge_id, code, email="new@example.com"):
    return client.post("/api/auth/register/verify", json={
        "email": email, "challengeId": challenge_id, "code": code,
    })


def test_manual_registration_verifies_email_and_uses_registration_password(auth_setup):
    app, client, db, emails, _ = auth_setup
    app.config["JWT_EXPIRES_HOURS"] = 168
    response = register_code(client)
    assert response.status_code == 200
    assert len(db.users.documents) == 1
    assert "token" not in response.json
    pending = db.pending_registrations.documents[0]
    assert pending["passwordHash"] != PASSWORD
    assert check_password_hash(pending["passwordHash"], PASSWORD)
    assert emails[0][1] not in str(pending)
    assert client.post("/api/auth/password/login", json={"email": "new@example.com", "password": PASSWORD}).status_code == 401

    verified = verify_code(client, response.json["challengeId"], emails[0][1])
    assert verified.status_code == 200
    user = verified.json["user"]
    assert user["emailVerified"] is True
    assert user["provider"] == "password"
    assert db.pending_registrations.documents == []
    assert "passwordHash" not in str(verified.json)
    assert client.get("/protected", headers={"Authorization": f"Bearer {verified.json['token']}"}).status_code == 200
    import jwt
    claims = jwt.decode(verified.json["token"], "test-secret", algorithms=["HS256"], issuer="pet-health")
    assert claims["exp"] - claims["iat"] == 168 * 3600

    login = client.post("/api/auth/password/login", json={"email": "NEW@example.com", "password": PASSWORD})
    assert login.status_code == 200
    assert login.json["user"]["userId"] == user["userId"]
    assert verify_code(client, response.json["challengeId"], emails[0][1]).status_code == 400


def test_google_only_account_cannot_request_or_use_password_setup(auth_setup):
    app, client, db, emails, user = auth_setup
    db.auth_credentials.documents = []
    response = client.post("/api/auth/password/request-code", json={"email": user["email"]})
    assert response.status_code == 200
    assert emails == []
    assert db.auth_credentials.documents == []
    with app.app_context():
        code_hash = auth_route.secret_hash("old-setup:12345678")
    db.auth_credentials.documents.append({
        "_id": user["userId"], "authVersion": 0, "resetId": "old-setup", "resetCodeHash": code_hash,
        "resetExpiresAt": auth_route.utc_now() + timedelta(minutes=10), "resetAttempts": 0,
    })
    assert save_password(client, user["email"], "old-setup", "12345678").status_code == 400
    assert "passwordHash" not in db.auth_credentials.documents[0]


@pytest.mark.parametrize("email", ["owner@example.com", " OWNER@EXAMPLE.COM "])
@pytest.mark.parametrize("provider", ["google", "password"])
def test_existing_account_registration_does_not_overwrite_password(auth_setup, email, provider):
    _, client, db, emails, _ = auth_setup
    db.users.documents[0]["provider"] = provider
    users_before = copy.deepcopy(db.users.documents)
    before = copy.deepcopy(db.auth_credentials.documents)
    response = register_code(client, email)
    assert response.status_code == 409
    assert response.json == {"error": auth_route.EMAIL_REGISTERED_MESSAGE}
    assert emails == []
    assert db.pending_registrations.documents == []
    assert db.auth_credentials.documents == before
    assert db.users.documents == users_before


def test_email_registered_while_otp_is_pending_cannot_be_overwritten(auth_setup):
    _, client, db, emails, _ = auth_setup
    response = register_code(client)
    db.users.insert_one({
        "_id": ObjectId(), "userId": "google:another-owner", "email": "new@example.com",
        "provider": "google", "emailVerified": True,
    })
    users_before = copy.deepcopy(db.users.documents)
    credentials_before = copy.deepcopy(db.auth_credentials.documents)
    verified = verify_code(client, response.json["challengeId"], emails[0][1])
    assert verified.status_code == 409
    assert verified.json == {"error": auth_route.EMAIL_REGISTERED_MESSAGE}
    assert db.pending_registrations.documents == []
    assert db.users.documents == users_before
    assert db.auth_credentials.documents == credentials_before


def test_duplicate_email_is_reported_without_email_sender(auth_setup):
    app, client, _, emails, _ = auth_setup
    app.config["SMTP_HOST"] = ""
    response = register_code(client, "owner@example.com")
    assert response.status_code == 409
    assert response.json == {"error": auth_route.EMAIL_REGISTERED_MESSAGE}
    assert emails == []


def test_expired_registration_code_and_wrong_attempt_limit(auth_setup):
    _, client, db, emails, _ = auth_setup
    response = register_code(client)
    challenge_id = response.json["challengeId"]
    code = emails[0][1]
    wrong = "00000000" if code != "00000000" else "11111111"
    for _ in range(5):
        assert verify_code(client, challenge_id, wrong).status_code == 400
    assert verify_code(client, challenge_id, code).status_code == 400
    response = register_code(client)
    db.pending_registrations.documents[0]["expiresAt"] = auth_route.utc_now() - timedelta(seconds=1)
    assert verify_code(client, response.json["challengeId"], emails[1][1]).status_code == 400
    assert len(db.users.documents) == 1


def test_registration_code_is_bound_to_email_and_new_code_replaces_old(auth_setup):
    _, client, _, emails, _ = auth_setup
    first = register_code(client)
    first_code = emails[0][1]
    assert verify_code(client, first.json["challengeId"], first_code, "other@example.com").status_code == 400
    second = register_code(client)
    assert verify_code(client, first.json["challengeId"], first_code).status_code == 400
    assert verify_code(client, second.json["challengeId"], emails[1][1]).status_code == 200


def test_manual_account_can_reset_existing_password(auth_setup):
    _, client, db, emails, _ = auth_setup
    response = register_code(client)
    verified = verify_code(client, response.json["challengeId"], emails[0][1])
    assert verified.status_code == 200
    old_token = verified.json["token"]
    challenge_id = request_code(client, "new@example.com")
    new_password = "my replacement pet health password"
    assert save_password(client, "new@example.com", challenge_id, emails[-1][1], new_password).status_code == 200
    assert client.get("/protected", headers={"Authorization": f"Bearer {old_token}"}).status_code == 401
    assert client.post("/api/auth/password/login", json={"email": "new@example.com", "password": PASSWORD}).status_code == 401
    assert client.post("/api/auth/password/login", json={"email": "new@example.com", "password": new_password}).status_code == 200
    assert len(db.users.documents) == 2


def test_registration_requires_email_sender_and_valid_password(auth_setup):
    app, client, db, emails, _ = auth_setup
    assert register_code(client, password="short").status_code == 400
    app.config["SMTP_HOST"] = ""
    assert register_code(client).status_code == 503
    assert db.pending_registrations.documents == []
    assert emails == []


def test_google_does_not_duplicate_manual_account(auth_setup, monkeypatch):
    _, client, db, emails, _ = auth_setup
    response = register_code(client)
    verified = verify_code(client, response.json["challengeId"], emails[0][1])
    original_user_id = verified.json["user"]["userId"]
    claims = {"aud": "allowed-client", "sub": "unlinked", "email": "new@example.com", "email_verified": True}
    monkeypatch.setattr(auth_route.id_token, "verify_oauth2_token", lambda *args: claims)
    response = client.post("/api/auth/google", json={"idToken": "token", "allowRegistration": True})
    assert response.status_code == 409
    assert len(db.users.documents) == 2
    assert db.users.find_one({"email": "new@example.com"})["userId"] == original_user_id
