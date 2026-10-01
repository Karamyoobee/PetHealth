from pymongo import MongoClient


class Mongo:
    def __init__(self):
        self.client = None
        self.db = None

    def init_app(self, app):
        self.client = MongoClient(app.config["MONGODB_URI"], serverSelectionTimeoutMS=3000)
        self.db = self.client[app.config["MONGODB_DB"]]
        if app.config["MONGODB_CREATE_INDEXES"]:
            self.ensure_indexes()

    def ensure_indexes(self):
        self.db.users.create_index("email", unique=True, sparse=True)
        self.db.users.create_index("userId", unique=True)
        self.db.pets.create_index([("userId", 1), ("name", 1)])
        self.db.pets.create_index("userId")
        self.db.vet_visits.create_index([("petId", 1), ("appointmentDate", -1)])
        self.db.vet_visits.create_index("userId")
        self.db.medications.create_index([("petId", 1), ("createdAt", -1)])
        self.db.medications.create_index("userId")
        self.db.reminders.create_index([("petId", 1), ("scheduledFor", 1)])
        self.db.reminders.create_index("userId")
        self.db.symptoms.create_index([("petId", 1), ("recordedAt", -1)])
        self.db.symptoms.create_index("userId")
        self.db.weight_entries.create_index([("petId", 1), ("recordedAt", -1)])
        self.db.weight_entries.create_index("userId")
        self.db.predictive_flags.create_index([("petId", 1), ("createdAt", -1)])
        self.db.predictive_flags.create_index("userId")


mongo = Mongo()
