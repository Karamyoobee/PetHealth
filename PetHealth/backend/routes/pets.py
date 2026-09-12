from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, jsonify, request

from database import mongo
from utils.auth import current_user_id
from utils.mongo import serialize_doc, validate_object_id

pets_bp = Blueprint("pets", __name__, url_prefix="/api")

PET_FIELDS = ("name", "species", "breed", "age", "sex", "weightKg", "spayedNeutered")
VET_VISIT_FIELDS = (
    "appointmentDate",
    "clinicName",
    "veterinarianName",
    "diagnosis",
    "treatment",
    "notes",
    "followUpDate",
)
MEDICATION_FIELDS = (
    "name",
    "dosage",
    "instructions",
    "schedule",
    "startDate",
    "endDate",
    "reminderTime",
)
REMINDER_FIELDS = ("type", "title", "scheduledFor", "repeat", "enabled")
SYMPTOM_FIELDS = ("name", "severity", "notes", "recordedAt")
WEIGHT_FIELDS = ("weightKg", "recordedAt", "notes")
FLAG_FIELDS = ("type", "title", "message", "severity", "createdAt", "resolved")


def utc_now():
    return datetime.now(timezone.utc)


def json_body():
    return request.get_json(silent=True) or {}


def pick(data, fields):
    return {field: data[field] for field in fields if field in data}


def error(message, status=400):
    return jsonify({"error": message}), status


def pet_filter(pet_id):
    if not validate_object_id(pet_id):
        return None
    return {"_id": ObjectId(pet_id), "userId": current_user_id()}


def get_pet_or_404(pet_id):
    query = pet_filter(pet_id)
    if query is None:
        return None
    return mongo.db.pets.find_one(query)


def list_collection(collection_name, pet_id, sort_field="createdAt", direction=-1):
    if get_pet_or_404(pet_id) is None:
        return error("Pet not found", 404)

    docs = mongo.db[collection_name].find({"petId": ObjectId(pet_id)}).sort(sort_field, direction)
    return jsonify([serialize_doc(doc) for doc in docs])


def create_collection_item(collection_name, pet_id, fields):
    if get_pet_or_404(pet_id) is None:
        return error("Pet not found", 404)

    data = json_body()
    doc = pick(data, fields)
    doc.update({"petId": ObjectId(pet_id), "userId": current_user_id(), "createdAt": utc_now(), "updatedAt": utc_now()})
    result = mongo.db[collection_name].insert_one(doc)
    saved = mongo.db[collection_name].find_one({"_id": result.inserted_id})
    return jsonify(serialize_doc(saved)), 201


@pets_bp.get("/pets")
def list_pets():
    docs = mongo.db.pets.find({"userId": current_user_id()}).sort("name", 1)
    return jsonify([serialize_doc(doc) for doc in docs])


@pets_bp.post("/pets")
def create_pet():
    data = json_body()
    if not data.get("name"):
        return error("Pet name is required")

    doc = pick(data, PET_FIELDS)
    doc.update({"userId": current_user_id(), "createdAt": utc_now(), "updatedAt": utc_now()})
    result = mongo.db.pets.insert_one(doc)
    saved = mongo.db.pets.find_one({"_id": result.inserted_id})
    return jsonify(serialize_doc(saved)), 201


@pets_bp.get("/pets/<pet_id>")
def get_pet(pet_id):
    pet = get_pet_or_404(pet_id)
    if pet is None:
        return error("Pet not found", 404)
    return jsonify(serialize_doc(pet))


@pets_bp.patch("/pets/<pet_id>")
def update_pet(pet_id):
    query = pet_filter(pet_id)
    if query is None:
        return error("Pet not found", 404)

    update = pick(json_body(), PET_FIELDS)
    if not update:
        return error("No valid pet fields supplied")

    update["updatedAt"] = utc_now()
    result = mongo.db.pets.update_one(query, {"$set": update})
    if result.matched_count == 0:
        return error("Pet not found", 404)

    return jsonify(serialize_doc(mongo.db.pets.find_one(query)))


@pets_bp.delete("/pets/<pet_id>")
def delete_pet(pet_id):
    query = pet_filter(pet_id)
    if query is None:
        return error("Pet not found", 404)

    result = mongo.db.pets.delete_one(query)
    if result.deleted_count == 0:
        return error("Pet not found", 404)

    object_id = ObjectId(pet_id)
    for collection in ("vet_visits", "medications", "reminders", "symptoms", "weight_entries", "predictive_flags"):
        mongo.db[collection].delete_many({"petId": object_id})

    return "", 204


@pets_bp.get("/pets/<pet_id>/vet-visits")
def list_vet_visits(pet_id):
    return list_collection("vet_visits", pet_id, "appointmentDate", -1)


@pets_bp.post("/pets/<pet_id>/vet-visits")
def create_vet_visit(pet_id):
    return create_collection_item("vet_visits", pet_id, VET_VISIT_FIELDS)


@pets_bp.get("/pets/<pet_id>/medications")
def list_medications(pet_id):
    return list_collection("medications", pet_id, "createdAt", -1)


@pets_bp.post("/pets/<pet_id>/medications")
def create_medication(pet_id):
    if get_pet_or_404(pet_id) is None:
        return error("Pet not found", 404)

    data = json_body()
    if not data.get("name"):
        return error("Medication name is required")
    doc = pick(data, MEDICATION_FIELDS)
    doc.update(
        {
            "petId": ObjectId(pet_id),
            "userId": current_user_id(),
            "doseLog": data.get("doseLog", []),
            "createdAt": utc_now(),
            "updatedAt": utc_now(),
        }
    )
    result = mongo.db.medications.insert_one(doc)
    return jsonify(serialize_doc(mongo.db.medications.find_one({"_id": result.inserted_id}))), 201


@pets_bp.patch("/medications/<medication_id>/doses")
def add_dose_log(medication_id):
    if not validate_object_id(medication_id):
        return error("Medication not found", 404)

    data = json_body()
    dose = pick(data, ("status", "takenAt", "notes"))
    if dose.get("status") not in ("taken", "missed"):
        return error("Dose status must be taken or missed")
    dose.setdefault("takenAt", utc_now().isoformat())

    result = mongo.db.medications.update_one(
        {"_id": ObjectId(medication_id), "userId": current_user_id()},
        {"$push": {"doseLog": dose}, "$set": {"updatedAt": utc_now()}},
    )
    if result.matched_count == 0:
        return error("Medication not found", 404)

    medication = mongo.db.medications.find_one({"_id": ObjectId(medication_id)})
    return jsonify(serialize_doc(medication))


@pets_bp.get("/pets/<pet_id>/reminders")
def list_reminders(pet_id):
    return list_collection("reminders", pet_id, "scheduledFor", 1)


@pets_bp.post("/pets/<pet_id>/reminders")
def create_reminder(pet_id):
    return create_collection_item("reminders", pet_id, REMINDER_FIELDS)


@pets_bp.get("/pets/<pet_id>/symptoms")
def list_symptoms(pet_id):
    return list_collection("symptoms", pet_id, "recordedAt", -1)


@pets_bp.post("/pets/<pet_id>/symptoms")
def create_symptom(pet_id):
    return create_collection_item("symptoms", pet_id, SYMPTOM_FIELDS)


@pets_bp.get("/pets/<pet_id>/weights")
def list_weights(pet_id):
    return list_collection("weight_entries", pet_id, "recordedAt", -1)


@pets_bp.post("/pets/<pet_id>/weights")
def create_weight(pet_id):
    return create_collection_item("weight_entries", pet_id, WEIGHT_FIELDS)


@pets_bp.get("/pets/<pet_id>/predictive-flags")
def list_predictive_flags(pet_id):
    return list_collection("predictive_flags", pet_id, "createdAt", -1)


@pets_bp.post("/pets/<pet_id>/predictive-flags")
def create_predictive_flag(pet_id):
    return create_collection_item("predictive_flags", pet_id, FLAG_FIELDS)


@pets_bp.get("/pets/<pet_id>/summary")
def pet_summary(pet_id):
    pet = get_pet_or_404(pet_id)
    if pet is None:
        return error("Pet not found", 404)

    object_id = ObjectId(pet_id)
    summary = {
        "pet": serialize_doc(pet),
        "counts": {
            "vetVisits": mongo.db.vet_visits.count_documents({"petId": object_id}),
            "medications": mongo.db.medications.count_documents({"petId": object_id}),
            "reminders": mongo.db.reminders.count_documents({"petId": object_id}),
            "symptoms": mongo.db.symptoms.count_documents({"petId": object_id}),
            "weights": mongo.db.weight_entries.count_documents({"petId": object_id}),
            "predictiveFlags": mongo.db.predictive_flags.count_documents({"petId": object_id}),
        },
        "latestWeight": serialize_doc(mongo.db.weight_entries.find_one({"petId": object_id}, sort=[("recordedAt", -1)]) or {}),
    }
    return jsonify(summary)
