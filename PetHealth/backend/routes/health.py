from flask import Blueprint, jsonify

from database import mongo

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health_check():
    return jsonify({"status": "ok"})


@health_bp.get("/health/db")
def database_health_check():
    try:
        mongo.client.admin.command("ping")
    except Exception as exc:
        return jsonify({"status": "error", "database": "unreachable", "message": str(exc)}), 503

    return jsonify({"status": "ok", "database": mongo.db.name})
