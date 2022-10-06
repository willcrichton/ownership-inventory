from flask import Flask, render_template, request
from flask_cors import CORS
from pathlib import Path

app = Flask(__name__)
CORS(app)
	
@app.route('/upload', methods = ['POST'])
def upload_file():
    recording = next(iter(request.files.keys()))
    f = request.files[recording]
    f.save(Path('recordings') / recording)
    return 'file uploaded successfully'
		
