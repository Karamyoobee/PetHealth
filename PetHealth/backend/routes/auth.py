from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify, request
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pymongo.errors import PyMongoError

from database import mongo
from utils.auth import create_session_token
from utils.mongo import serialize_doc

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def utc_now():
    return datetime.now(timezone.utc)


@auth_bp.post("/google")
def google_login():
    body = request.get_json(silent=True) or {}
    token = body.get("idToken")
    if not token:
        return jsonify({"error": "Google idToken is required"}), 400

    try:
        google_user = id_token.verify_oauth2_token(token, google_requests.Request())
    except ValueError:
        return jsonify({"error": "Invalid Google token"}), 401
    except Exception:
        current_app.logger.exception("Google token verification failed")
        return jsonify({"error": "Could not verify Google token"}), 502

    allowed_client_ids = current_app.config["GOOGLE_CLIENT_IDS"]
    if allowed_client_ids and google_user.get("aud") not in allowed_client_ids:
        return jsonify({"error": "Google token audience is not allowed"}), 401

    email = google_user.get("email")
    if not email:
        return jsonify({"error": "Google account email is required"}), 400

    now = utc_now()
    user_id = f"google:{google_user['sub']}"
    update = {
        "$setOnInsert": {
            "userId": user_id,
            "provider": "google",
            "googleSubject": google_user["sub"],
            "createdAt": now,
        },
        "$set": {
            "email": email,
            "emailVerified": bool(google_user.get("email_verified")),
            "name": google_user.get("name") or email.split("@")[0],
            "picture": google_user.get("picture"),
            "lastLoginAt": now,
            "updatedAt": now,
        },
    }

    try:
        mongo.db.users.update_one({"userId": user_id}, update, upsert=True)
        user = mongo.db.users.find_one({"userId": user_id})
        session_token, expires_at = create_session_token(user)

        mongo.db.sessions.insert_one(
            {
                "userId": user_id,
                "email": email,
                "tokenType": "jwt",
                "createdAt": now,
                "expiresAt": expires_at,
            }
        )
    except PyMongoError:
        current_app.logger.exception("Could not save Google user session")
        return jsonify({"error": "Could not save Google login"}), 503

    return jsonify(
        {
            "token": session_token,
            "tokenType": "Bearer",
            "expiresAt": expires_at.isoformat(),
            "user": serialize_doc(user),
        }
    )
