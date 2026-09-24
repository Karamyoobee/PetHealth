from datetime import datetime, timezone

from database import mongo
from utils.auth import current_user_email, current_user_id, current_user_name


def utc_now():
    return datetime.now(timezone.utc)


def ensure_current_user(profile=None):
    user_id = current_user_id()
    profile = profile or {}
    now = utc_now()
    update = {
        "$setOnInsert": {
            "userId": user_id,
            "createdAt": now,
        },
        "$set": {
            "name": profile.get("name") or current_user_name(),
            "updatedAt": now,
        },
    }

    email = profile.get("email") or current_user_email()
    if email:
        update["$set"]["email"] = email

    phone = profile.get("phone")
    if phone:
        update["$set"]["phone"] = phone

    mongo.db.users.update_one({"userId": user_id}, update, upsert=True)
    return mongo.db.users.find_one({"userId": user_id})
