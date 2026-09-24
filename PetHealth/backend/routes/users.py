from flask import Blueprint, jsonify, request

from database import mongo
from utils.auth import current_user_id
from utils.mongo import serialize_doc
from utils.users import ensure_current_user

users_bp = Blueprint("users", __name__, url_prefix="/api")


@users_bp.get("/users")
def list_users():
    docs = mongo.db.users.find().sort("createdAt", -1)
    return jsonify([serialize_doc(doc) for doc in docs])


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
    ensure_current_user()
    docs = mongo.db.pets.find({"userId": current_user_id()}).sort("name", 1)
    return jsonify([serialize_doc(doc) for doc in docs])
