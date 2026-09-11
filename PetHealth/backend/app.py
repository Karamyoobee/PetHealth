from flask import Flask
from flask_cors import CORS

from config import Config
from database import mongo
from routes.health import health_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, origins=Config.CORS_ORIGINS)
    mongo.init_app(app)

    app.register_blueprint(health_bp)

    return app


app = create_app()
