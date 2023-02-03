from flask import Flask, render_template, request
from flask_cors import CORS
from pathlib import Path
from pathvalidate import sanitize_filename
import json
import utils

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 1 * 1000 * 1000 * 1000
CORS(app)


@app.route("/upload", methods=["POST"])
def upload_file():
    recording = next(iter(request.files.keys()))
    f = request.files[recording]
    f.save(Path("recordings") / sanitize_filename(recording))
    return "file uploaded successfully"


@app.route("/ownership-inventory", methods=["POST"])
def ownership_inventory():
    with open("ownership-inventory.log", "a+") as f:
        json.dump(request.json, f)
        f.write("\n")
    return "json uploaded successfully"


@app.route("/ownership-inventory-feedback", methods=["POST"])
def ownership_inventory_feedback():
    with open("ownership-inventory-feedback.log", "a+") as f:
        json.dump(request.json, f)
        f.write("\n")
    return "json uploaded successfully"


@app.route("/ownership-inventory-setup", methods=["GET"])
def ownership_inventory_setup():
    df, _ = utils.load_inventory_responses()
    if len(df) >= 10:
        return {"finished": True}
    else:
        sample = utils.sample_next_inventory_problems()
        print("Sampled: ", sample)
        return {"finished": False, "problems": sample}


@app.route("/trpl-evaluator", methods=["POST"])
def trpl_evaluator():
    with open("trpl-evaluator.txt", "a+") as f:
        json.dump(request.json, f)
        f.write("\n")
    return "json uploaded successfully"


@app.route("/ping", methods=["GET"])
def ping():
    return "ping"


if __name__ == "__main__":
    app.run()
