from bson import ObjectId
from flask import Blueprint, send_file, jsonify

from database import mongo
from services.pdf_report import build_pet_report
from utils.auth import current_user_id
from utils.mongo import validate_object_id

reports_bp = Blueprint("reports", __name__, url_prefix="/api")


def _not_found():
    return jsonify({"error": "Pet not found"}), 404


@reports_bp.get("/pets/<pet_id>/report.pdf")
def pet_report_pdf(pet_id):
    if not validate_object_id(pet_id):
        return _not_found()

    object_id = ObjectId(pet_id)
    pet = mongo.db.pets.find_one({"_id": object_id, "userId": current_user_id()})
    if pet is None:
        return _not_found()

    query = {"petId": object_id}
    buffer = build_pet_report(
        pet,
        mongo.db.vet_visits.find(query).sort("appointmentDate", -1),
        mongo.db.medications.find(query).sort("createdAt", -1),
        mongo.db.reminders.find(query).sort("scheduledFor", 1),
        mongo.db.symptoms.find(query).sort("recordedAt", -1),
        mongo.db.weight_entries.find(query).sort("recordedAt", -1),
        mongo.db.predictive_flags.find(query).sort("createdAt", -1),
    )

    filename = f"{pet.get('name', 'pet')}-health-report.pdf".replace(" ", "-").lower()
    return send_file(buffer, mimetype="application/pdf", as_attachment=True, download_name=filename)
