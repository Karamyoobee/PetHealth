from flask import Blueprint, jsonify, request #Blueprint = route group, request to read URL, jsonify = send JSON
from database import mongo                  #shared Mongodb connection to database

#Group file route: used by every route (in this project) that starts with /api
#same pattern as pets.py
breeds_bp = Blueprint("breeds", __name__, url_prefix="/api")

#Route - GET request to api/breeds 
@breeds_bp.get("/breeds")
def list_breeds(): #Display Pet Breeds Function - from breeds.csv file (stored in mongodb database)
    #read ?species from URL, using lowercase and trim to accept "Cat" = "cat" 
    species = request.args.get("species","").strip().lower()
    query = {"species": species} if species else {} #filter to find by either: dog or cat (no specie) match every breed
    docs = mongo.db['breeds'].find(query).sort("breed", 1)#sort names from A-Z (search inside imported (breeds.csv file)) for matched breeds 
    return jsonify([d["breed"] for d in docs])#Retrieve and display the breeds in JSON list (not the entire complete document list of breed)
