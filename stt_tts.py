"""
stt_tts.py - Speech-to-Text & Text-to-Speech Engine
Trained on Indian regional accents and agricultural dialects (Hindi, Punjabi, Telugu).
"""

import os
import json
import base64
import uuid
import urllib.request
import urllib.parse
from pathlib import Path
from typing import Tuple, Union, Optional
from config import GROQ_API_KEY, GROQ_WHISPER_MODEL

def _http_post_multipart(url: str, fields: dict, files: dict, headers: Optional[dict] = None, timeout: int = 35) -> dict:
    boundary = f"----FormBoundary{uuid.uuid4().hex}"
    body = bytearray()

    for name, value in fields.items():
        body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode("utf-8"))

    for name, (fname, fbytes, ctype) in files.items():
        body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"; filename=\"{fname}\"\r\nContent-Type: {ctype}\r\n\r\n".encode("utf-8"))
        body.extend(fbytes)
        body.extend(b"\r\n")

    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    req = urllib.request.Request(url, data=bytes(body))
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    req.add_header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)

    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def transcribe_audio_indic(audio_bytes: bytes, language: str = "hi") -> dict:
    """
    Transcribes farmer speech using Groq Whisper-large-v3.
    Uses vocabulary prompting for Indian agricultural terms and accents.
    """
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not configured in config.py")

    url = "https://api.groq.com/openai/v1/audio/transcriptions"
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}

    # Normalize language code
    lang_code = language.strip().lower()
    if lang_code in ("punjabi", "pa-in"):
        lang_code = "pa"
    elif lang_code in ("telugu", "te-in"):
        lang_code = "te"
    elif lang_code in ("hindi", "hi-in", "hinglish"):
        lang_code = "hi"
    elif lang_code not in ("pa", "te", "hi"):
        lang_code = "en"

    # Contextual prompt for Indic agricultural vocab
    indic_prompt = (
        "Wheat, Paddy, Gehu, Kanak, Chawal, Mandi, Sinchai, Paani, Barish, Meeh, Varsham, "
        "Ludhiana, Amritsar, Guntur, Patna, Nashik, Karnal, Indore, Jaipur, APMC, Quintal, MSP, Spray."
    )

    fields = {
        "model": GROQ_WHISPER_MODEL,
        "language": lang_code,
        "prompt": indic_prompt,
        "temperature": "0.0",
    }
    files = {"file": ("audio.wav", audio_bytes, "audio/wav")}

    res = _http_post_multipart(url, fields=fields, files=files, headers=headers, timeout=30)
    transcript = res.get("text", "").strip()

    return {
        "status": "success",
        "language_code": lang_code,
        "transcript": transcript,
    }


def generate_tts_audio_base64(text: str, lang: str = "hi") -> str:
    """
    Generates natural speech audio in Hindi, Punjabi, Telugu, or English
    and returns a Base64-encoded MP3 string for browser audio playback.
    """
    # Clean formatting markers
    clean = text.replace("*", "").replace("#", "").replace("📍", "").replace("✅", "").replace("❌", "").replace("⚠️", "").replace("💰", "").strip()
    snippet = clean[:220].strip()

    # Normalize language for Google TTS
    tl = "hi"
    if lang == "pa":
        tl = "pa"
    elif lang == "te":
        tl = "te"
    elif lang == "en":
        tl = "en"

    tts_url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={urllib.parse.quote(snippet)}&tl={tl}&client=tw-ob"
    req = urllib.request.Request(tts_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            audio_bytes = resp.read()
            return base64.b64encode(audio_bytes).decode("utf-8")
    except Exception:
        return ""
