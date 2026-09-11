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
        self.db.pets.create_index([("userId", 1), ("name", 1)])
        self.db.vet_visits.create_index([("petId", 1), ("appointmentDate", -1)])
        self.db.medications.create_index([("petId", 1), ("createdAt", -1)])
        self.db.reminders.create_index([("petId", 1), ("scheduledFor", 1)])


mongo = Mongo()
