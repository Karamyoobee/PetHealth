import hashlib
import re
import secrets
from datetime import datetime, timezone
from uuid import UUID, uuid4

from flask import Blueprint, current_app, jsonify, request

from database import mongo
from services.reminders import reminder_timezone
from utils.auth import current_session, current_user_id

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


def push_configured():
    try:
        UUID(current_app.config.get("EXPO_PROJECT_ID", ""))
    except (ValueError, TypeError, AttributeError):
        return False
    return current_app.config.get("EXPO_PUSH_ENABLED", False)


@notifications_bp.get("/config")
def notification_config():
    current_user_id()
    enabled = bool(push_configured())
    return jsonify({"enabled": enabled, "projectId": current_app.config["EXPO_PROJECT_ID"] if enabled else None})


def installation_details(data):
    # Check the phone's registration details without storing its secret as plain text.
    if not isinstance(data, dict):
        raise ValueError("Enter valid notification registration details")
    try:
        installation_id = str(UUID(data.get("installationId", "")))
    except (ValueError, TypeError, AttributeError):
        raise ValueError("Invalid notification installation")
    secret = data.get("installationSecret")
    if not isinstance(secret, str) or not 32 <= len(secret) <= 256:
        raise ValueError("Invalid notification installation secret")
    return installation_id, hashlib.sha256(secret.encode()).hexdigest()


@notifications_bp.post("/devices")
def register_device():
    # Tie this phone to the current account so alerts go to the right installation.
    user_id = current_user_id()
    if not push_configured():
        return jsonify({"error": "Server push notifications are not configured yet"}), 503
    data = request.get_json(silent=True)
    try:
        installation_id, secret_hash = installation_details(data)
        reminder_timezone(data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    token = data.get("token")
    if not isinstance(token, str) or not re.fullmatch(r"(?:Expo|Exponent)PushToken\[[A-Za-z0-9_-]{10,200}\]", token):
        return jsonify({"error": "Invalid Expo push token"}), 400
    if data.get("platform") not in ("android", "ios"):
        return jsonify({"error": "Push notifications require an Android or iOS device"}), 400
    existing = mongo.db.notification_devices.find_one({"_id": installation_id})
    if existing and not secrets.compare_digest(existing["secretHash"], secret_hash):
        return jsonify({"error": "Notification installation could not be verified"}), 403
    other = mongo.db.notification_devices.find_one({"token": token, "active": True, "_id": {"$ne": installation_id}})
    if other and other["userId"] != user_id:
        return jsonify({"error": "This phone's notification registration must be cleared before switching accounts"}), 409
    session = current_session()
    auth_version = session.get("authVersion", 0)
    same_binding = existing and existing.get("active") and existing.get("userId") == user_id and existing.get("token") == token and existing.get("authVersion") == auth_version
    now = datetime.now(timezone.utc)
    binding = existing["binding"] if same_binding else str(uuid4())
    if other:
        mongo.db.notification_devices.update_one({"_id": other["_id"]}, {"$set": {"active": False}})
    mongo.db.notification_devices.update_one({"_id": installation_id}, {
        "$set": {
            "userId": user_id, "token": token, "secretHash": secret_hash, "platform": data["platform"],
            "timezone": data.get("timezone"), "timezoneOffset": data.get("timezoneOffset", 0),
            "authVersion": auth_version, "active": True, "binding": binding, "updatedAt": now,
            "activeSince": existing["activeSince"] if same_binding else now,
        }, "$setOnInsert": {"createdAt": now},
    }, upsert=True)
    return jsonify({"mode": "push"})


@notifications_bp.post("/devices/unregister")
def unregister_device():
    # This capability can only disable its own installation, including after JWT expiry.
    try:
        installation_id, secret_hash = installation_details(request.get_json(silent=True))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    existing = mongo.db.notification_devices.find_one({"_id": installation_id})
    if existing:
        if not secrets.compare_digest(existing["secretHash"], secret_hash):
            return jsonify({"error": "Notification installation could not be verified"}), 403
        mongo.db.notification_devices.update_one({"_id": installation_id, "secretHash": secret_hash}, {
            "$set": {"active": False, "updatedAt": datetime.now(timezone.utc)},
        })
    return "", 204
