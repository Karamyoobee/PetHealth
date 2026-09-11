from bson import ObjectId


def validate_object_id(value):
    return ObjectId.is_valid(value)


def serialize_doc(doc):
    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key if key != "_id" else "id"] = str(value)
        elif hasattr(value, "isoformat"):
            result[key] = value.isoformat()
        elif isinstance(value, list):
            result[key] = [serialize_doc(item) if isinstance(item, dict) else item for item in value]
        else:
            result[key] = value
    return result
