"""
server.py - Zero-Dependency High-Performance Web Application for Kisan Mitra
21st.dev Glassmorphic UI with Dark Mode, Full Website Multilingual Switching,
Device GPS Location, Voice District Input, Groq Whisper STT & Qwen LLM Precision Engine.
"""

import os
import sys
import json
import base64
import urllib.parse
import urllib.request
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Reconfigure stdout/stderr for Windows console
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

from config import (
    UI_TRANSLATIONS,
    ALERT_TRANSLATIONS,
    CROP_TRANSLATIONS,
    RATING_TRANSLATIONS,
    SOIL_STATUS_TRANSLATIONS,
    FACTOR_TRANSLATIONS,
    SERVER_PORT,
    SERVER_HOST,
    DATA_GOV_IN_API_KEY,
    GROQ_API_KEY,
    DEFAULT_DISTRICT,
    DEFAULT_CROP
)
from data_fetcher import (
    get_district_complete_report,
    get_system_api_status,
    resolve_district,
    reverse_geocode_gps,
    extract_district_from_query
)
from ai_engine import get_ai_answer, detect_query_language
from stt_tts import transcribe_audio_indic, generate_tts_audio_base64

PORT = SERVER_PORT

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


class AgriAssistantHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress noisy HTTP access logs
        pass

    def _serve_file(self, filepath: Path, content_type: str):
        """Helper to stream static files with appropriate content headers."""
        if not filepath.is_file():
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"404 Not Found")
            return
        try:
            content = filepath.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(f"Error serving file: {e}".encode("utf-8"))

    def do_HEAD(self):
        parsed = urllib.parse.urlparse(self.path)
        clean_path = parsed.path.lstrip("/")
        if not clean_path or clean_path == "index.html":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
        elif clean_path in ("style.css", "static/style.css"):
            self.send_response(200)
            self.send_header("Content-Type", "text/css; charset=utf-8")
        elif clean_path in ("app.js", "static/app.js"):
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript; charset=utf-8")
        else:
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        # -------------------------------------------------------------
        # 1. API Endpoints
        # -------------------------------------------------------------
        if parsed.path == "/api/translations":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            payload = {
                "ui": UI_TRANSLATIONS,
                "alerts": ALERT_TRANSLATIONS,
                "crops": CROP_TRANSLATIONS,
                "ratings": RATING_TRANSLATIONS,
                "soil_statuses": SOIL_STATUS_TRANSLATIONS,
                "factors": FACTOR_TRANSLATIONS
            }
            self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))
            return

        if parsed.path == "/api/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            status_report = get_system_api_status()
            self.wfile.write(json.dumps(status_report, ensure_ascii=False).encode("utf-8"))
            return

        if parsed.path == "/api/district":
            qs = urllib.parse.parse_qs(parsed.query)
            dist = qs.get("name", [DEFAULT_DISTRICT])[0]
            crop = qs.get("crop", [DEFAULT_CROP])[0]
            try:
                report = get_district_complete_report(dist, commodity=crop)
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps(report, ensure_ascii=False).encode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        # -------------------------------------------------------------
        # 2. Static Web App Files (HTML, CSS, JS, Assets)
        # -------------------------------------------------------------
        clean_path = parsed.path.lstrip("/")

        # Serve index.html on root / or /index.html
        if not clean_path or clean_path == "index.html":
            self._serve_file(BASE_DIR / "index.html", "text/html; charset=utf-8")
            return

        # Serve stylesheet
        if clean_path in ("style.css", "static/style.css"):
            self._serve_file(BASE_DIR / "style.css", "text/css; charset=utf-8")
            return

        # Serve JavaScript app
        if clean_path in ("app.js", "static/app.js"):
            self._serve_file(BASE_DIR / "app.js", "application/javascript; charset=utf-8")
            return

        # Generic static file handler within BASE_DIR
        target = (BASE_DIR / clean_path).resolve()
        try:
            # Prevent path traversal outside BASE_DIR
            if str(target).startswith(str(BASE_DIR)) and target.is_file():
                mime_map = {
                    ".html": "text/html; charset=utf-8",
                    ".css": "text/css; charset=utf-8",
                    ".js": "application/javascript; charset=utf-8",
                    ".json": "application/json; charset=utf-8",
                    ".svg": "image/svg+xml",
                    ".png": "image/png",
                    ".jpg": "image/jpeg",
                    ".jpeg": "image/jpeg",
                    ".ico": "image/x-icon",
                    ".wav": "audio/wav",
                    ".mp3": "audio/mpeg",
                }
                content_type = mime_map.get(target.suffix.lower(), "application/octet-stream")
                self._serve_file(target, content_type)
                return
        except Exception:
            pass

        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)

        # GPS Reverse Geocoding
        if parsed.path == "/api/location/gps":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            data = json.loads(body)
            lat = float(data.get("lat", 30.9010))
            lon = float(data.get("lon", 75.8573))
            try:
                res = reverse_geocode_gps(lat, lon)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(res).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        # Voice District Input
        if parsed.path == "/api/location/voice":
            content_type = self.headers.get("Content-Type", "")
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length)

            boundary = content_type.split("boundary=")[1].encode("utf-8")
            parts = raw_body.split(b"--" + boundary)

            audio_data = None
            lang = "hi"
            for p in parts:
                if b'name="audio"' in p and b"\r\n\r\n" in p:
                    audio_data = p.split(b"\r\n\r\n", 1)[1].rsplit(b"\r\n", 1)[0]
                elif b'name="lang"' in p and b"\r\n\r\n" in p:
                    lang = p.split(b"\r\n\r\n", 1)[1].rsplit(b"\r\n", 1)[0].decode("utf-8")

            if not audio_data:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({"error": "No audio received"}).encode("utf-8"))
                return

            try:
                stt_res = transcribe_audio_indic(audio_data, language=lang)
                transcript = stt_res.get("transcript", "").strip()
                extracted = extract_district_from_query(transcript)
                if not extracted and transcript:
                    first_token = transcript.replace(".", "").replace(",", "").split()[0]
                    extracted = first_token.capitalize()
                final_district = extracted or "Ludhiana"

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"district": final_district, "transcript": transcript}).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        # Chat Text Query (Text reply strictly)
        if parsed.path == "/api/chat":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            data = json.loads(body)
            dist = data.get("district", "Ludhiana")
            crop = data.get("crop", "Wheat")
            q = data.get("question", "")
            lang = data.get("lang", "en")

            try:
                report = get_district_complete_report(dist, commodity=crop)
                answer = get_ai_answer(report, q, user_lang=lang)
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"answer": answer}, ensure_ascii=False).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        # Voice Assistant Query (Voice Reply + Text Reply)
        if parsed.path == "/api/voice":
            content_type = self.headers.get("Content-Type", "")
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length)

            boundary = content_type.split("boundary=")[1].encode("utf-8")
            parts = raw_body.split(b"--" + boundary)

            audio_data = None
            district = "Ludhiana"
            crop = "Wheat"
            lang = "hi"

            for p in parts:
                if b'name="audio"' in p and b"\r\n\r\n" in p:
                    audio_data = p.split(b"\r\n\r\n", 1)[1].rsplit(b"\r\n", 1)[0]
                elif b'name="district"' in p and b"\r\n\r\n" in p:
                    district = p.split(b"\r\n\r\n", 1)[1].rsplit(b"\r\n", 1)[0].decode("utf-8")
                elif b'name="crop"' in p and b"\r\n\r\n" in p:
                    crop = p.split(b"\r\n\r\n", 1)[1].rsplit(b"\r\n", 1)[0].decode("utf-8")
                elif b'name="lang"' in p and b"\r\n\r\n" in p:
                    lang = p.split(b"\r\n\r\n", 1)[1].rsplit(b"\r\n", 1)[0].decode("utf-8")

            if not audio_data:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({"error": "No audio received"}).encode("utf-8"))
                return

            try:
                stt_res = transcribe_audio_indic(audio_data, language=lang)
                transcript = stt_res.get("transcript", "").strip()

                # Check if district was mentioned in speech
                spoken_dist = extract_district_from_query(transcript)
                active_dist = spoken_dist if spoken_dist else district

                report = get_district_complete_report(active_dist, commodity=crop)
                answer = get_ai_answer(report, transcript, user_lang=lang)

                detected_lang = detect_query_language(transcript, default_lang=lang)
                tts_lang = "hi" if detected_lang in ("hi", "hinglish") else detected_lang
                audio_b64 = generate_tts_audio_base64(answer, lang=tts_lang)

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "transcript": transcript,
                    "answer": answer,
                    "audio_base64": audio_b64,
                    "district": active_dist
                }, ensure_ascii=False).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return


def start_server():
    server = ThreadedHTTPServer((SERVER_HOST, PORT), AgriAssistantHandler)
    url = f"http://localhost:{PORT}"
    print("=" * 65)
    print(" [KISAN MITRA] MULTILINGUAL AGRITECH WEB APPLICATION")
    print(" [UI] 21st.dev Style + Dark Mode + GPS + Voice Location + Groq AI")
    print(f" [URL] Local Web UI: {url}")
    print(f" [LAN] Share on Wi-Fi: http://<YOUR_LOCAL_IP>:{PORT}")
    print("=" * 65)
    try:
        webbrowser.open(url)
    except Exception:
        pass
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        server.server_close()


if __name__ == "__main__":
    start_server()
