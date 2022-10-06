from flask import Flask, render_template, request
from flask_cors import CORS
from pathlib import Path
from pathvalidate import sanitize_filename

app = Flask(__name__)
CORS(app)
	
@app.route('/upload', methods = ['POST'])
def upload_file():
    recording = next(iter(request.files.keys()))
    f = request.files[recording]
    f.save(Path('recordings') / sanitize_filename(recording))
    return 'file uploaded successfully'
		
