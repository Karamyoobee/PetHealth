from flask import Blueprint, jsonify, request

from database import mongo
from utils.auth import current_user_id
from utils.mongo import serialize_doc
from utils.users import ensure_current_user

users_bp = Blueprint("users", __name__, url_prefix="/api")


@users_bp.get("/users")
def list_users():
    user = ensure_current_user()
    return jsonify([serialize_doc(user)])


@users_bp.get("/users/me")
def get_current_user():
    user = ensure_current_user()
    return jsonify(serialize_doc(user))


@users_bp.patch("/users/me")
def update_current_user():
    user = ensure_current_user(request.get_json(silent=True) or {})
    return jsonify(serialize_doc(user))


@users_bp.get("/users/me/pets")
def list_current_user_pets():
    # Return only the pets belonging to the signed-in account.
    ensure_current_user()
    docs = mongo.db.pets.find({"userId": current_user_id()}).sort("name", 1)
    return jsonify([serialize_doc(doc) for doc in docs])


@users_bp.delete("/users/me")
def delete_current_user():
    # Delete the signed-in account and the records created for its pets.
    user_id = current_user_id()
    user = mongo.db.users.find_one({"userId": user_id})
    if user is None:
        return jsonify({"error": "Account not found"}), 404

    pet_ids = [pet["_id"] for pet in mongo.db.pets.find({"userId": user_id}, {"_id": 1})]
    pet_records = ("vet_visits", "medications", "reminders", "symptoms", "weight_entries", "predictive_flags", "vaccinations", "chats")
    for collection in pet_records:
        mongo.db[collection].delete_many({"$or": [{"userId": user_id}, {"petId": {"$in": pet_ids}}]})

    mongo.db.pets.delete_many({"userId": user_id})
    device_ids = [device["_id"] for device in mongo.db.notification_devices.find({"userId": user_id}, {"_id": 1})]
    mongo.db.notification_deliveries.delete_many({"deviceId": {"$in": device_ids}})
    mongo.db.notification_devices.delete_many({"userId": user_id})
    mongo.db.sessions.delete_many({"userId": user_id})
    mongo.db.auth_credentials.delete_one({"_id": user_id})
    mongo.db.users.delete_one({"userId": user_id})
    return "", 204
