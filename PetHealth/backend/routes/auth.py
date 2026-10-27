import hashlib
import hmac
import re
import secrets
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from bson import ObjectId
from flask import Blueprint, current_app, jsonify, request
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError, PyMongoError
from werkzeug.security import check_password_hash, generate_password_hash

from database import mongo
from services.auth_email import email_configured, queue_password_email, queue_registration_email
from utils.auth import create_session_token
from utils.mongo import serialize_doc

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
PASSWORD_HASH_METHOD = "scrypt:131072:8:1"
DUMMY_PASSWORD_HASH = generate_password_hash(secrets.token_urlsafe(32), method=PASSWORD_HASH_METHOD)
RESET_MESSAGE = "If this email belongs to a verified Pet Health account with a password, a reset code will be sent."
REGISTRATION_MESSAGE = "A verification code will be sent to your email. Check your inbox and Spam folder."
EMAIL_REGISTERED_MESSAGE = "This email is already registered. Please sign in or use another email address."


def utc_now():
    return datetime.now(timezone.utc)


def json_body():
    body = request.get_json(silent=True)
    return body if isinstance(body, dict) else {}


def normalized_email(value):
    if not isinstance(value, str):
        return None
    email = value.strip().lower()
    if len(email) > 254 or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        return None
    return email


def secret_hash(value):
    return hmac.new(current_app.config["JWT_SECRET"].encode(), value.encode(), hashlib.sha256).hexdigest()


def rate_limited(action, identity, limit, seconds=900):
    now = utc_now()
    window = int(now.timestamp()) // seconds
    key = secret_hash(f"{action}:{identity}:{window}")
    query = {"_id": key}
    update = {"$inc": {"count": 1}, "$setOnInsert": {"expiresAt": now + timedelta(seconds=seconds)}}
    try:
        counter = mongo.db.auth_limits.find_one_and_update(query, update, upsert=True, return_document=ReturnDocument.AFTER)
    except DuplicateKeyError:
        counter = mongo.db.auth_limits.find_one_and_update(query, {"$inc": {"count": 1}}, return_document=ReturnDocument.AFTER)
    return counter["count"] > limit


def verified_account(email):
    return mongo.db.users.find_one({
        "provider": {"$in": ["google", "password"]},
        "emailVerified": True,
        "$or": [
            {"googleEmail": email},
            {"googleEmail": {"$exists": False}, "email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}},
        ],
    })


def existing_email(email):
    return mongo.db.users.find_one({"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}})


def valid_password(password):
    return isinstance(password, str) and 15 <= len(password) <= 128 and not password.isspace()


@auth_bp.post("/register/request-code")
def request_registration_code():
    body = json_body()
    email = normalized_email(body.get("email"))
    name = body.get("name")
    password = body.get("password")
    if not email or not isinstance(name, str) or not 1 <= len(name.strip()) <= 80:
        return jsonify({"error": "Enter a name and valid email address"}), 400
    if not valid_password(password):
        return jsonify({"error": "Use a password between 15 and 128 characters"}), 400
    if rate_limited("register-ip", request.remote_addr or "unknown", 30) or rate_limited("register-email", email, 3):
        return jsonify({"error": "Too many code requests. Please try again in 15 minutes."}), 429
    if existing_email(email):
        return jsonify({"error": EMAIL_REGISTERED_MESSAGE}), 409
    if not email_configured():
        return jsonify({"error": "Email verification is not available yet. Please try again later or use Google."}), 503

    challenge_id = secrets.token_urlsafe(32)
    code = f"{secrets.randbelow(100000000):08d}"
    password_hash = generate_password_hash(password, method=PASSWORD_HASH_METHOD)
    now = utc_now()
    mongo.db.pending_registrations.update_one({"_id": secret_hash(f"register:{email}")}, {
        "$set": {
            "email": email, "name": name.strip(), "userId": f"email:{uuid4().hex}",
            "passwordHash": password_hash, "challengeId": challenge_id,
            "codeHash": secret_hash(f"register:{challenge_id}:{code}"),
            "expiresAt": now + timedelta(minutes=10), "attempts": 0, "claimed": False,
        },
    }, upsert=True)
    queue_registration_email(email, code)
    return jsonify({"message": REGISTRATION_MESSAGE, "challengeId": challenge_id})


@auth_bp.post("/register/verify")
def verify_registration():
    body = json_body()
    email = normalized_email(body.get("email"))
    challenge_id = body.get("challengeId")
    code = body.get("code")
    if not email or not isinstance(code, str) or not re.fullmatch(r"\d{8}", code) or not isinstance(challenge_id, str) or not 1 <= len(challenge_id) <= 100:
        return jsonify({"error": "Enter the email and eight-digit verification code"}), 400
    if rate_limited("register-verify-ip", request.remote_addr or "unknown", 60):
        return jsonify({"error": "Too many attempts. Please try again in 15 minutes."}), 429

    invalid_code = {"error": "The code is invalid or expired. Request a new code."}
    query = {
        "_id": secret_hash(f"register:{email}"), "email": email, "challengeId": challenge_id,
        "expiresAt": {"$gt": utc_now()}, "attempts": {"$lt": 5}, "claimed": False,
    }
    pending = mongo.db.pending_registrations.find_one_and_update(query, {"$inc": {"attempts": 1}}, return_document=ReturnDocument.AFTER)
    code_hash = secret_hash(f"register:{challenge_id}:{code}")
    if not pending or not hmac.compare_digest(pending["codeHash"], code_hash):
        return jsonify(invalid_code), 400

    query["attempts"] = {"$lte": 5}
    query["codeHash"] = code_hash
    query["expiresAt"] = {"$gt": utc_now()}
    pending = mongo.db.pending_registrations.find_one_and_update(query, {"$set": {"claimed": True}}, return_document=ReturnDocument.AFTER)
    if not pending:
        return jsonify(invalid_code), 400
    pending_query = {"_id": pending["_id"], "challengeId": challenge_id}
    if existing_email(email):
        mongo.db.pending_registrations.delete_one(pending_query)
        return jsonify({"error": EMAIL_REGISTERED_MESSAGE}), 409

    now = utc_now()
    user = {
        "_id": ObjectId(), "userId": pending["userId"], "name": pending["name"], "email": email,
        "provider": "password", "emailVerified": True, "createdAt": now, "updatedAt": now, "lastLoginAt": now,
    }
    try:
        mongo.db.auth_credentials.update_one({"_id": user["userId"]}, {"$setOnInsert": {
            "passwordHash": pending["passwordHash"], "authVersion": 0,
            "createdAt": now, "passwordChangedAt": now,
        }}, upsert=True)
        mongo.db.users.insert_one(user)
    except DuplicateKeyError:
        mongo.db.auth_credentials.delete_one({"_id": user["userId"], "authVersion": 0})
        mongo.db.pending_registrations.delete_one(pending_query)
        return jsonify({"error": EMAIL_REGISTERED_MESSAGE}), 409
    except PyMongoError:
        mongo.db.pending_registrations.update_one(pending_query, {"$set": {"claimed": False}})
        raise
    mongo.db.pending_registrations.delete_one(pending_query)
    return session_response(user, 0)


def session_response(user, auth_version=None):
    now = utc_now()
    session_token, expires_at = create_session_token(user, auth_version)
    mongo.db.sessions.insert_one({
        "userId": user["userId"],
        "email": user["email"],
        "tokenType": "jwt",
        "createdAt": now,
        "expiresAt": expires_at,
    })
    return jsonify({
        "token": session_token,
        "tokenType": "Bearer",
        "expiresAt": expires_at.isoformat(),
        "user": serialize_doc(user),
    })


@auth_bp.errorhandler(PyMongoError)
def database_error(exc):
    current_app.logger.error("Authentication database request failed (%s)", type(exc).__name__)
    return jsonify({"error": "Authentication is temporarily unavailable. Please try again."}), 503


@auth_bp.post("/google")
def google_login():
    body = json_body()
    token = body.get("idToken")
    if not isinstance(token, str) or not token:
        return jsonify({"error": "Google idToken is required"}), 400
    if not current_app.config["GOOGLE_CLIENT_IDS"]:
        return jsonify({"error": "Google sign-in is not configured on the server"}), 503

    try:
        google_user = id_token.verify_oauth2_token(token, google_requests.Request())
    except ValueError:
        return jsonify({"error": "Invalid Google token"}), 401
    except Exception:
        current_app.logger.error("Google token verification failed")
        return jsonify({"error": "Could not verify Google token"}), 502

    if google_user.get("aud") not in current_app.config["GOOGLE_CLIENT_IDS"]:
        return jsonify({"error": "Google token audience is not allowed"}), 401
    email = normalized_email(google_user.get("email"))
    if not email or google_user.get("email_verified") is not True or not google_user.get("sub"):
        return jsonify({"error": "A verified Google account email is required"}), 401

    now = utc_now()
    user_id = f"google:{google_user['sub']}"
    existing = mongo.db.users.find_one({"userId": user_id})
    if not existing and existing_email(email):
        return jsonify({"error": "This email already has an account. Please use its existing sign-in method."}), 409
    if not existing and body.get("allowRegistration") is not True:
        return jsonify({"error": "Please use Continue with Google on the Welcome screen to create your account first."}), 403
    update = {
        "$setOnInsert": {
            "userId": user_id,
            "provider": "google",
            "googleSubject": google_user["sub"],
            "createdAt": now,
        },
        "$set": {
            "email": email,
            "googleEmail": email,
            "emailVerified": True,
            "name": google_user.get("name") or email.split("@")[0],
            "picture": google_user.get("picture"),
            "lastLoginAt": now,
            "updatedAt": now,
        },
    }
    try:
        mongo.db.users.update_one({"userId": user_id}, update, upsert=True)
    except DuplicateKeyError:
        return jsonify({"error": "This email already has an account. Please use its existing sign-in method."}), 409
    return session_response(mongo.db.users.find_one({"userId": user_id}))


@auth_bp.post("/password/login")
def password_login():
    body = json_body()
    email = normalized_email(body.get("email"))
    password = body.get("password")
    if not email or not isinstance(password, str) or not 1 <= len(password) <= 128:
        return jsonify({"error": "Enter a valid email and password"}), 400
    if rate_limited("login-ip", request.remote_addr or "unknown", 60) or rate_limited("login-email", email, 10):
        return jsonify({"error": "Too many sign-in attempts. Please try again in 15 minutes."}), 429

    user = verified_account(email)
    credentials = mongo.db.auth_credentials.find_one({"_id": user["userId"]}) if user else None
    password_hash = (credentials or {}).get("passwordHash", DUMMY_PASSWORD_HASH)
    valid_password = check_password_hash(password_hash, password)
    if not user or not credentials or not credentials.get("passwordHash") or not valid_password:
        return jsonify({"error": "Email or password is incorrect. Google-only accounts must use Continue with Google."}), 401

    now = utc_now()
    mongo.db.users.update_one({"userId": user["userId"]}, {"$set": {"lastLoginAt": now, "updatedAt": now}})
    return session_response(user, credentials.get("authVersion", 0))


@auth_bp.post("/password/request-code")
def request_password_code():
    email = normalized_email(json_body().get("email"))
    if not email:
        return jsonify({"error": "Enter a valid email address"}), 400
    if not email_configured():
        return jsonify({"error": "Password emails are not available yet. Please use Continue with Google."}), 503
    if rate_limited("reset-ip", request.remote_addr or "unknown", 30) or rate_limited("reset-email", email, 3):
        return jsonify({"error": "Too many code requests. Please try again in 15 minutes."}), 429

    challenge_id = secrets.token_urlsafe(32)
    code = f"{secrets.randbelow(100000000):08d}"
    code_hash = secret_hash(f"{challenge_id}:{code}")
    user = verified_account(email)
    credentials = mongo.db.auth_credentials.find_one({"_id": user["userId"]}) if user else None
    if credentials and credentials.get("passwordHash"):
        now = utc_now()
        mongo.db.auth_credentials.update_one({"_id": user["userId"]}, {
            "$set": {
                "resetId": challenge_id,
                "resetCodeHash": code_hash,
                "resetExpiresAt": now + timedelta(minutes=10),
                "resetAttempts": 0,
            },
        })
        queue_password_email(user.get("googleEmail") or user["email"], code)
    return jsonify({"message": RESET_MESSAGE, "challengeId": challenge_id})


@auth_bp.post("/password/reset")
def reset_password():
    body = json_body()
    email = normalized_email(body.get("email"))
    code = body.get("code")
    challenge_id = body.get("challengeId")
    password = body.get("password")
    if not email or not isinstance(code, str) or not re.fullmatch(r"\d{8}", code) or not isinstance(challenge_id, str) or not 1 <= len(challenge_id) <= 100:
        return jsonify({"error": "Enter the email and eight-digit code from your password email"}), 400
    if not valid_password(password):
        return jsonify({"error": "Use a password between 15 and 128 characters"}), 400
    if rate_limited("reset-verify-ip", request.remote_addr or "unknown", 60):
        return jsonify({"error": "Too many attempts. Please try again in 15 minutes."}), 429

    invalid_code = ({"error": "The code is invalid or expired. Request a new code."}, 400)
    user = verified_account(email)
    if not user:
        return jsonify(invalid_code[0]), invalid_code[1]
    query = {
        "_id": user["userId"],
        "resetId": challenge_id,
        "resetExpiresAt": {"$gt": utc_now()},
        "resetAttempts": {"$lt": 5},
        "passwordHash": {"$exists": True},
    }
    credentials = mongo.db.auth_credentials.find_one_and_update(query, {"$inc": {"resetAttempts": 1}}, return_document=ReturnDocument.AFTER)
    code_hash = secret_hash(f"{challenge_id}:{code}")
    if not credentials or not credentials.get("passwordHash") or not hmac.compare_digest(credentials["resetCodeHash"], code_hash):
        return jsonify(invalid_code[0]), invalid_code[1]

    password_hash = generate_password_hash(password, method=PASSWORD_HASH_METHOD)
    saved = mongo.db.auth_credentials.find_one_and_update({
        "_id": user["userId"], "resetId": challenge_id, "resetCodeHash": code_hash,
        "resetExpiresAt": {"$gt": utc_now()}, "resetAttempts": {"$lte": 5},
        "passwordHash": {"$exists": True},
    }, {
        "$set": {"passwordHash": password_hash, "passwordChangedAt": utc_now()},
        "$inc": {"authVersion": 1},
        "$unset": {"resetId": "", "resetCodeHash": "", "resetExpiresAt": "", "resetAttempts": ""},
    }, return_document=ReturnDocument.AFTER)
    if not saved:
        return jsonify(invalid_code[0]), invalid_code[1]
    mongo.db.sessions.delete_many({"userId": user["userId"]})
    if email_configured():
        queue_password_email(user.get("googleEmail") or user["email"])
    return jsonify({"message": "Password saved. Sign in with your email and new Pet Health password."})
