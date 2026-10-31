from flask import Blueprint, jsonify, request 
from database import mongo

#Blueprint for breeds file
breeds_bp = Blueprint("breeds", __name__, url_prefix="/api")

#Route - GET request to api/breeds 
@breeds_bp.get("/breeds")
def list_breeds(): #Display Pet Breeds Function - from breeds.csv file (stored in mongodb database)
    #read species from database
    species = request.args.get("species","").strip().lower()
    query = {"species": species} if species else {} #filter to find either an dog or cat
    docs = mongo.db['breeds'].find(query).sort("breed", 1)#sort names from A-Z 
    return jsonify([d["breed"] for d in docs])#Retrieve and display the breeds in plain text
