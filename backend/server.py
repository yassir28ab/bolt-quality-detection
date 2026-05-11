# Ensure eventlet is monkey-patched at the top
import eventlet
eventlet.monkey_patch()

import logging
from flask import Flask, jsonify, request, send_from_directory
from flask_socketio import SocketIO, emit
import base64
from io import BytesIO
from PIL import Image
import cv2
import numpy as np
from flask_cors import CORS
from ultralytics import YOLO
import os
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Set up basic logging
logging.basicConfig(level=logging.INFO)

# LOADING MODEL
model = YOLO("best.pt")  # load a custom model

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'

CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins='*')
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    multimedia = db.relationship('Multimedia', backref='uploader', lazy=True)

class Bolt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quality = db.Column(db.Boolean, nullable=False)
    x_min = db.Column(db.Float, nullable=False)
    x_max = db.Column(db.Float, nullable=False)
    y_min = db.Column(db.Float, nullable=False)
    y_max = db.Column(db.Float, nullable=False)
    conf = db.Column(db.Float, nullable=False)
    multimedia_id = db.Column(db.Integer, db.ForeignKey('multimedia.id'), nullable=False)

class Multimedia(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content_type = db.Column(db.String(20), nullable=False)
    uploaded_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    bolts = db.relationship('Bolt', backref='multimedia', lazy=True)

with app.app_context():
    db.create_all()


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    new_user = User(username=data['username'], password=data['password'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and user.password == data['password']:
        return jsonify({'message': 'Login successful', 'user': {'id': user.id, 'username': user.username}}), 200
    return jsonify({'message': 'Invalid credentials'}), 401

def process_frame(model, frame, conf_thresh, nms_thresh, colors):

    results = model(frame, conf=conf_thresh, iou=nms_thresh)
    boxes = results[0].boxes
    xyxy = boxes.xyxy.cpu().numpy()
    conf = boxes.conf.cpu().numpy()
    cls = boxes.cls.cpu().numpy()

    keep = np.ones(len(conf), dtype=bool)

    for i in range(len(xyxy)):
        if not keep[i]:
            continue
        for j in range(i + 1, len(xyxy)):
            if not keep[j]:
                continue
            x1_max = max(xyxy[i][0], xyxy[j][0])
            y1_max = max(xyxy[i][1], xyxy[j][1])
            x2_min = min(xyxy[i][2], xyxy[j][2])
            y2_min = min(xyxy[i][3], xyxy[j][3])
            inter_area = max(0, x2_min - x1_max + 1) * max(0, y2_min - y1_max + 1)
            box1_area = (xyxy[i][2] - xyxy[i][0] + 1) * (xyxy[i][3] - xyxy[i][1] + 1)
            box2_area = (xyxy[j][2] - xyxy[j][0] + 1) * (xyxy[j][3] - xyxy[j][1] + 1)
            iou = inter_area / (box1_area + box2_area - inter_area)
            if iou > nms_thresh:
                if conf[i] > conf[j]:
                    keep[j] = False
                else:
                    keep[i] = False
                    break

    font_scale = 0.6
    thickness = 2
    bolts = []
    for i, box in enumerate(xyxy):
        if not keep[i]:
            continue
        x1, y1, x2, y2 = map(int, box[:4])
        cls_id = int(cls[i])
        color = colors[cls_id]
        label = f"{'Boulon_Bon' if cls_id == 0 else 'Boulon_Mauvais'} {conf[i]:.2f}"

        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        (text_width, text_height), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
        cv2.rectangle(frame, (x1, y1 - text_height - baseline), (x1 + text_width, y1), color, -1)
        cv2.putText(frame, label, (x1, y1 - baseline), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), thickness)
        bolt_number = f"#{i+1}"
        cv2.putText(frame, bolt_number, (x1, y2 + text_height), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), thickness)
        
        bolts.append({
            'quality': cls_id == 0,
            'x_min': x1,
            'x_max': x2,
            'y_min': y1,
            'y_max': y2,
            'conf': conf[i]
        })
    
    return frame, bolts

input_dir = "input"
output_dir = "output"
os.makedirs(output_dir, exist_ok=True)
os.makedirs(input_dir, exist_ok=True)

def process_input(model, input_path, output_path, conf_thresh=None, nms_thresh=None, img_size=None, user_id=None):
    default_conf_thresh = 0.25  # Default confidence threshold from YOLOv8 documentation
    default_nms_thresh = 0.45   # Default NMS threshold from YOLOv8 documentation

    conf_thresh = conf_thresh if conf_thresh is not None else default_conf_thresh
    nms_thresh = nms_thresh if nms_thresh is not None else default_nms_thresh

    colors = {
        0: (0, 255, 0),  # Green for Boulon_Bon
        1: (0, 0, 255)   # Red for Boulon_Mauvais
    }

    if input_path.lower().endswith(('.mp4', '.avi', '.mov', '.mkv')):
        cap = cv2.VideoCapture(input_path)
        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        fourcc = cv2.VideoWriter_fourcc(*'avc1')
        out = cv2.VideoWriter(output_path, fourcc, fps, (frame_width, frame_height))
        max_bolts = 0
        optimal_frame = None
        optimal_bolts = []

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            processed_frame, bolts = process_frame(model, frame, conf_thresh, nms_thresh, colors)
            out.write(processed_frame)
            if len(bolts) > max_bolts:
                max_bolts = len(bolts)
                optimal_frame = processed_frame
                optimal_bolts = bolts

        cap.release()
        out.release()
        cv2.destroyAllWindows()

        if optimal_frame is not None:
            # Save optimal frame as image
            optimal_image_path = output_path.rsplit('.', 1)[0] + "_optimal.jpg"
            cv2.imwrite(optimal_image_path, optimal_frame)
            # Save to database
            new_multimedia = Multimedia(
                user_id=user_id,
                content_type='video',
            )
            db.session.add(new_multimedia)
            db.session.commit()

            for bolt in optimal_bolts:
                new_bolt = Bolt(
                    quality=bolt['quality'],
                    x_min=bolt['x_min'],
                    x_max=bolt['x_max'],
                    y_min=bolt['y_min'],
                    y_max=bolt['y_max'],
                    conf=bolt['conf'],
                    multimedia_id=new_multimedia.id
                )
                db.session.add(new_bolt)
            db.session.commit()

    else:
        frame = cv2.imread(input_path)
        processed_frame, bolts = process_frame(model, frame, conf_thresh, nms_thresh, colors)
        cv2.imwrite(output_path, processed_frame)
        
        new_multimedia = Multimedia(
            user_id=user_id,
            content_type='image',
        )
        db.session.add(new_multimedia)
        db.session.commit()

        for bolt in bolts:
            new_bolt = Bolt(
                quality=bolt['quality'],
                x_min=bolt['x_min'],
                x_max=bolt['x_max'],
                y_min=bolt['y_min'],
                y_max=bolt['y_max'],
                conf=bolt['conf'],
                multimedia_id=new_multimedia.id
            )
            db.session.add(new_bolt)
        db.session.commit()

def cleanup_directory(directory):
    """Delete all files in the given directory."""
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
        except Exception as e:
            print(f'Failed to delete {file_path}. Reason: {e}')

@app.route("/api/upload", methods=['POST'])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    filename = file.filename
    cleanup_directory(input_dir)
    cleanup_directory(output_dir)

    file_input_path = os.path.join(input_dir, filename)
    file_output_path = os.path.join(output_dir, filename)
    file.save(file_input_path)

    user_id = request.form.get('user_id')

    conf_thresh = request.form.get('confidence', type=float)
    nms_thresh = request.form.get('nmsThreshold', type=float)

    # conf_thresh = None  # Confidence threshold (None to use default)
    # nms_thresh = None   # NMS threshold (None to use default)
    # img_size = None     # Input image size (None to use default)

    # Predict using the YOLO model
    process_input(model=model, input_path=file_input_path, output_path=file_output_path, conf_thresh=conf_thresh, nms_thresh=nms_thresh, user_id=user_id)

    return jsonify({"message": "Prediction done", "output": file_output_path}), 200

@app.route('/api/history/<int:user_id>', methods=['GET'])
def get_history(user_id):
    multimedias = Multimedia.query.filter_by(user_id=user_id).all()
    history = []
    for multimedia in multimedias:
        bolts = Bolt.query.filter_by(multimedia_id=multimedia.id).all()
        history.append({
            'multimedia_id': multimedia.id,
            'content_type': multimedia.content_type,
            'uploaded_at': multimedia.uploaded_at,
            'path': f'output/{multimedia.id}.jpg',  # Adjust path as needed
            'bolts': [{'id': bolt.id, 'quality': bolt.quality, 'x_min': bolt.x_min, 'x_max': bolt.x_max, 'y_min': bolt.y_min, 'y_max': bolt.y_max, 'conf': bolt.conf} for bolt in bolts]
        })
    return jsonify(history), 200

@app.route('/api/history/<int:user_id>/<int:multimedia_id>', methods=['DELETE'])
def delete_multimedia(user_id, multimedia_id):
    try:
        multimedia = Multimedia.query.filter_by(id=multimedia_id, user_id=user_id).first()
        if not multimedia:
            return jsonify({'error': 'Multimedia not found'}), 404
        
        # Delete associated bolts first
        Bolt.query.filter_by(multimedia_id=multimedia.id).delete()
        
        db.session.delete(multimedia)
        db.session.commit()
        return jsonify({'message': 'Multimedia deleted'}), 200
    except Exception as e:
        logging.error(f"Error deleting multimedia: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/history/clear/<int:user_id>', methods=['DELETE'])
def clear_history(user_id):
    try:
        multimedias = Multimedia.query.filter_by(user_id=user_id).all()
        for multimedia in multimedias:
            # Delete associated bolts first
            Bolt.query.filter_by(multimedia_id=multimedia.id).delete()
            db.session.delete(multimedia)
        db.session.commit()
        return jsonify({'message': 'All multimedia deleted'}), 200
    except Exception as e:
        logging.error(f"Error clearing history for user {user_id}: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/output/<path:filename>', methods=['GET'])
def serve_file(filename):
    return send_from_directory(output_dir, filename)

@socketio.on("frame")
def handle_frame(data):
    # Decode the image
    img_data = base64.b64decode(data['dataURL'].split(",")[1])
    img = Image.open(BytesIO(img_data))
    frame = np.array(img)

    # Retrieve YOLO parameters
    conf_thresh = float(data.get('confidence', 0.25))
    nms_thresh = float(data.get('nmsThreshold', 0.45))

    colors = {
        0: (0, 255, 0),  # Green for Boulon_Bon
        1: (0, 0, 255)   # Red for Boulon_Mauvais
    }
    rgb_frame=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    processed_frame, bolts = process_frame(model, rgb_frame, conf_thresh, nms_thresh, colors)

    # Convert BGR to RGB
    #processed_frame_rgb = cv2.cvtColor(processed_frame, cv2.COLOR_BGR2RGB)

    # Encode the processed frame back to base64
    _, buffer = cv2.imencode('.jpg', processed_frame)
    processed_data = base64.b64encode(buffer).decode('utf-8')
    processed_data = f"data:image/jpeg;base64,{processed_data}"

    # Send the processed frame back to the client
    emit("processedFrame", processed_data)

@socketio.on("stop")
def handle_stop():
    # Logic to stop the processing and clean up resources
    # If there's any specific cleanup required, it should be handled here
    emit("stopped", {"status": "streaming stopped"})

@socketio.on("offer")
def handle_offer(data):
    emit("offer", data, broadcast=True, include_self=False)

@socketio.on("answer")
def handle_answer(data):
    emit("answer", data, broadcast=True, include_self=False)

@socketio.on("candidate")
def handle_candidate(data):
    emit("candidate", data, broadcast=True, include_self=False)

if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0', port=8080, debug=True)
