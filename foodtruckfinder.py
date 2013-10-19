from flask import Flask, render_template, request, Response
import os
import json

app = Flask(__name__)

def load_markers():
	json_data = open(os.getcwd() + '/static/data/rqzj-sfat.json')
	applicants = json.load(json_data)
	json_data.close()

	return applicants

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/get_markers", methods = ['GET'])
def get_markers():
	global applicants

	min_lat = float(request.args.get("minLat"))
	max_lat = float(request.args.get("maxLat"))
	min_lng = float(request.args.get("minLng"))
	max_lng = float(request.args.get("maxLng"))

	markers = []

	for applicant in applicants: # THIS KVP LOOKUP DOESN'T WORK
		if float(applicant.get("latitude", 0)) > min_lat \
				and float(applicant.get("latitude", 0)) < max_lat \
				and float(applicant.get("longitude", 0)) > min_lng \
				and float(applicant.get("longitude", 0)) < max_lng:
			markers.append(applicant)

	return Response(json.dumps(markers), mimetype='application/json')

applicants = load_markers()

if __name__ == "__main__":
    app.run(debug=True)