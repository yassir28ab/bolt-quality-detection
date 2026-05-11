# Bolt Quality Detection System

![Python](https://img.shields.io/badge/Python-3.11.9-blue?logo=python)
![Next.js](https://img.shields.io/badge/Next.js-Pages_Router-black?logo=next.js)
![YOLOv8](https://img.shields.io/badge/YOLOv8-Custom_Model-orange)
![Flask](https://img.shields.io/badge/Flask-3.0-lightgrey?logo=flask)
![License](https://img.shields.io/badge/license-MIT-green)

A real-time computer vision inspection platform for detecting and classifying bolt defects. A custom YOLOv8 model — trained from scratch on a dataset of **1,322 annotated images** across two classes (conforming / non-conforming) — is served via a Flask + Socket.IO backend. A Next.js frontend supports three inspection modes: **video upload**, **image upload**, and **live WebRTC camera streaming**.

---

## Demo

https://github.com/user-attachments/assets/adf01947-95a1-450e-976a-9cf218d7d160

---

## Architecture

```text
[Camera / Video File / Image]
          ↓
[Next.js Frontend — localhost:3000]
          ↓ HTTP multipart (upload modes)
          ↓ Socket.IO frames (live mode)
[Flask Backend — localhost:8080]
          ↓
[YOLOv8 — best.pt]  ←── custom-trained on bolt dataset
          ↓
[Annotated output: bounding boxes, class labels, confidence scores]
          ↓
[Response via HTTP or Socket.IO emit → displayed in UI]

Live feed (WebRTC):
[Remote camera device] ──WebRTC P2P──→ [Detection page]
                                              ↓ frames via Socket.IO
                                        [YOLOv8 inference]
```

---

## Tech Stack

| Layer     | Technology                                       |
| --------- | ------------------------------------------------ |
| Frontend  | Next.js (Pages Router), React, Tailwind CSS      |
| Backend   | Flask, Flask-SocketIO, eventlet                  |
| ML Model  | YOLOv8 (Ultralytics), custom-trained             |
| Real-time | WebRTC (peer-to-peer), Socket.IO                 |
| Database  | SQLite via Flask-SQLAlchemy                      |
| Training  | Training executed on Google Colab NVIDIA T4 GPU. |
| Dataset   | Roboflow + Kaggle + custom collection            |

---

## Model Training

The detection model was custom-trained on a domain-specific bolt inspection dataset assembled specifically for this project:

- **Data sources:** Roboflow, Kaggle, and manually collected images
- **Dataset size:** 1,322 annotated images
- **Classes:** `Boulon_Bon` (conforming) · `Boulon_Mauvais` (non-conforming)
- **Split:** 70% train (924 imgs) · 20% validation (301 imgs) · 10% test (97 imgs)
- **Preprocessing:** augmentation pipeline via Roboflow (flips, brightness shifts, mosaic)
- **Training:** YOLOv8, 200 epochs on Google Colab T4 GPU
- **Algorithm choice:** YOLOv8 was selected over Faster R-CNN and SSD for its single-pass architecture, real-time inference speed, and straightforward fine-tuning on custom classes.

**Download model weights:** [HuggingFace →](https://huggingface.co/yassir28ab/yolov8-bolt-quality-detection/blob/main/best.pt)

Place `best.pt` in the `backend/` folder before running the server.

Alternatively, download it programmatically:

```bash
pip install huggingface_hub

python -c "
from huggingface_hub import hf_hub_download

hf_hub_download(
    repo_id='yassir28ab/yolov8-bolt-quality-detection',
    filename='best.pt',
    local_dir='.'
)
"
```

---

## Project Structure

```text
bolt-quality-detection/
├── backend/
│   ├── server.py              # Flask app, Socket.IO handlers, YOLO inference
│   ├── requirements.txt       # Python dependencies (Python 3.11.x required)
│   ├── best.pt                # ← NOT in git, download separately
│   ├── input/                 # Runtime: uploaded files (gitignored)
│   └── output/                # Runtime: processed results (gitignored)
├── frontend/
│   ├── pages/
│   │   ├── _app.js            # AuthProvider wrapper
│   │   ├── index.js           # Redirect to /home
│   │   ├── home.js            # Landing page
│   │   ├── detection.js       # Main detection workspace
│   │   ├── send-stream.js     # Camera sender (open on mobile/camera device)
│   │   ├── login.js
│   │   ├── register.js
│   │   └── help.jsx
│   ├── components/
│   │   ├── AppHeader.jsx
│   │   ├── AppFooter.jsx
│   │   ├── BoltIcon.jsx
│   │   ├── SectionHeading.jsx
│   │   └── ProcessLiveStream.jsx
│   ├── contexts/
│   │   └── authContext.js
│   ├── lib/
│   │   └── api.js
│   ├── styles/
│   │   └── globals.css
│   └── .env.example
└── .gitignore
```

---

## Getting Started

### Prerequisites

| Tool    | Version                         |
| ------- | ------------------------------- |
| Python  | **3.11.x** (3.11.9 recommended) |
| Node.js | 18+                             |
| npm     | 9+                              |

---

### 1. Clone the repository

```bash
git clone https://github.com/yassir28ab/bolt-quality-detection.git
cd bolt-quality-detection
```

---

### 2. Backend setup

#### Download model weights

Download `best.pt` from:

- HuggingFace: https://huggingface.co/yassir28ab/yolov8-bolt-quality-detection/blob/main/best.pt

Then place it in:

```text
backend/
└── best.pt
```

Or download it directly from the command line:

```bash
pip install huggingface_hub

python -c "
from huggingface_hub import hf_hub_download

hf_hub_download(
    repo_id='yassir28ab/yolov8-bolt-quality-detection',
    filename='best.pt',
    local_dir='.'
)
"
```

#### Create a virtual environment (Python 3.11 required)

```bash
cd backend

# Windows
py -3.11 -m venv venv
venv\Scripts\activate

# macOS / Linux
python3.11 -m venv venv
source venv/bin/activate
```

> **Important:** Make sure `python --version` shows `3.11.x` before installing packages.
> On Windows, if you have multiple Python versions, use `py -3.11` explicitly.

#### Install dependencies

```bash
pip install -r requirements.txt
```

> If you get errors on `opencv-python`, try `pip install opencv-python-headless` instead.

#### Run the backend

```bash
python server.py
```

The backend starts on `http://localhost:8080`.

---

### 3. Frontend setup

```bash
cd frontend

# Copy env file and set your backend URL
cp .env.example .env.local
```

`.env.local` contents:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SOCKET_URL=http://localhost:8080
```

```bash
npm install
npm run dev
```

The frontend starts on `http://localhost:3000`.

---

### 4. Open the app

| URL                                 | Page                                 |
| ----------------------------------- | ------------------------------------ |
| `http://localhost:3000`             | Home (redirects from `/`)            |
| `http://localhost:3000/detection`   | Detection workspace (login required) |
| `http://localhost:3000/send-stream` | Camera sender for live feed mode     |
| `http://localhost:3000/help`        | Documentation                        |

Register an account, then log in to access the detection page.

---

## Testing the Live Feed Mode

Live feed requires two devices on the same network:

- **Device A (camera sender):** open `http://YOUR_IP:3000/send-stream`, select a camera, press **Start Stream**
- **Device B (inspector):** open `http://localhost:3000/detection`, select **Live Feed** mode

For single-machine testing, use **Import Video** or **Import Image** instead.

> ⚠️ **Camera access requires HTTPS** (except on `localhost`). If you access the app from another device using an IP address, camera permissions may be blocked by the browser.

### HTTPS for local network

To enable camera access from devices on your network:

```bash
# Install mkcert
choco install mkcert          # Windows
brew install mkcert           # Mac

mkcert -install
mkcert localhost 192.168.X.X
```

Then configure your local HTTPS certificates in the frontend setup.

---

## Features

- 🔍 **Image inspection** — upload a JPG/PNG, run YOLOv8 inference, view annotated output
- 🎬 **Video inspection** — upload MP4/AVI/MOV, process frame by frame, output annotated video
- 📡 **Live WebRTC feed** — stream from a phone camera in real time
- 📋 **Detection history** — per-user history of detections and processed outputs
- 📄 **PDF export** — export detection history as a PDF report
- ⚙️ **YOLO parameter control** — adjust confidence threshold and NMS threshold via sliders

---

## Screenshots

| Home                                                                                                        | Detection                                                                                                             | History                                                                                                           |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| ![home](https://raw.githubusercontent.com/yassir28ab/bolt-quality-detection/main/docs/screenshots/home.png) | ![detection](https://raw.githubusercontent.com/yassir28ab/bolt-quality-detection/main/docs/screenshots/detection.png) | ![history](https://raw.githubusercontent.com/yassir28ab/bolt-quality-detection/main/docs/screenshots/history.png) |

---

## Detection Example

![Detection Example](https://raw.githubusercontent.com/yassir28ab/bolt-quality-detection/main/docs/result/detection-result.jpg)

## License

MIT — see [LICENSE](LICENSE) for details.

## Media Credits

Demo footage sourced from Vecteezy.
