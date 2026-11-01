# 🌾 Kisan Mitra (किसान मित्र) - Multilingual Agritech Voice & Climate Advisory Assistant

An intelligent, lightweight, conversational and voice-enabled agritech assistant built for Indian farmers. It ingests live weather forecasts, 4-strata rootzone soil metrics, and APMC mandi market prices to deliver plain-language, crop-level protective advice and planting/harvesting schedules.

Designed with **21st.dev glassmorphic aesthetics**, **Dark Mode toggle**, **full-website localization (Hindi, Hinglish, Punjabi, Telugu, English)**, **device GPS geolocation**, and **voice district selection**.

---

## 🚀 Key Features

1. **Full-Website Multilingual Localization:**
   - Seamlessly toggle between **English**, **हिन्दी (Hindi / Hinglish)**, **ਪੰਜਾਬੀ (Punjabi)**, and **తెలుగు (Telugu)**.
   - Every card, label, navigation button, badge, chip, and placeholder dynamically translates in real time.

2. **Precision AI Advisory Engine (`ai_engine.py`):**
   - Powered by **Groq High-Speed Inference (`qwen/qwen3.8-27b`)**.
   - **Answers STRICTLY what is asked**: If a farmer asks *"Will it rain tomorrow?"*, it gives a concise rain forecast without dumping unrelated soil metrics or mandi rates.
   - **Language Style Matching**: Responds in natural **Hinglish** when asked in Hinglish, pure Hindi for Hindi questions, Gurmukhi Punjabi for Punjabi, and Telugu for Telugu.

3. **Acoustic & Voice Capabilities (`stt_tts.py`):**
   - **Voice Input:** Uses **Groq Whisper-large-v3** tuned with Indian agricultural vocabulary prompts (gehu, kanak, sinchai, barish, varsham, meeh, APMC, quintal, mandi).
   - **Dual Output for Voice:** Clicking the microphone returns **Both Voice Audio Reply + Text Reply**.
   - **Text-Only for Typing:** Typing in the input box returns **Text Reply Only**.

4. **District Discovery (Voice + GPS):**
   - **📍 Device GPS Location:** Uses HTML5 Geolocation API with reverse geocoding to auto-detect the farmer's current district and state.
   - **🎤 Speak District:** Speak any district name into the microphone (e.g. *"Ludhiana"*, *"Patna"*, *"Guntur"*, *"Nashik"*) to automatically fetch live telemetry.

5. **Zero-Tolerance Dummy Data Compliance (`data_fetcher.py`):**
   - **Live Weather:** Open-Meteo ECMWF model (temperature, relative humidity, precipitation now, 24-hour rainfall forecast).
   - **4-Layer Soil Health:** Open-Meteo ECMWF Land Model (topsoil 0-1cm, 1-3cm, rootzone 3-9cm, subsoil 9-27cm, surface temperature, 14-day rainfall sum).
   - **Mandi Prices:** Data.gov.in Agmarknet official APMC mandi rates (modal price, min price, max price, market yard name, arrival date).

6. **Modern 21st.dev UI Aesthetics:**
   - Clean glassmorphism (`backdrop-filter: blur(12px)`), rounded-2xl cards, emerald glow highlights, and a persistent Dark Mode switch.

---

## 📂 Modular File Architecture

```text
C:\agritech_assistant\
├── .env              # Environment secrets, model choices & server settings
├── .env.example      # Example environment template for deployment
├── server.py         # Multi-threaded web application server & static file controller
├── index.html        # Modular HTML5 application UI structure
├── style.css         # 21st.dev glassmorphic design system & dark mode CSS
├── app.js            # Client-side JavaScript (telemetry, STT/TTS, GPS, alerts, yield)
├── ai_engine.py      # Precision LLM reasoning engine (Qwen 3.8-27B) & Hinglish matcher
├── stt_tts.py        # Groq Whisper-large-v3 Indic STT & base64 TTS audio streamer
├── data_fetcher.py   # Live APIs: Open-Meteo, ECMWF Soil, Data.gov.in Agmarknet, GPS
├── config.py         # Zero-dependency .env loader, crop aliases, UI translation dictionaries
├── run.bat           # 1-Click launcher with automatic LAN IP detection for other devices
├── cache.db          # SQLite 60-min TTL cache preventing API rate limits
└── README.md         # Complete system and deployment documentation
```

---

## ⚡ How to Run on Your Device

### Method 1: 1-Click Batch File (Recommended)
Simply double-click `run.bat` in File Explorer.

### Method 2: Command Line (PowerShell / Command Prompt)
```powershell
cd C:\agritech_assistant
python -B server.py
```

Open your browser at:
👉 **`http://localhost:8501`**

---

## 📱 How to Share and Use on Other Devices (Phone, Tablet, Laptop)

### On the Same Wi-Fi / Local Network (LAN):
1. Make sure your computer running `server.py` and your phone or other laptop are connected to the same Wi-Fi router.
2. Find your computer's local IPv4 address (e.g., `192.168.1.15`):
   - In PowerShell run: `ipconfig` (look for *IPv4 Address*).
   - Or check the startup message in `run.bat` which prints it automatically.
3. On your phone's browser (Chrome / Safari), open:
   👉 **`http://192.168.1.15:8501`** (replace with your actual IP address).
4. You can speak into your phone's mic, toggle dark mode, switch languages, and use device GPS directly from your phone!

### Sharing Over the Internet (Anywhere in the World):
To share the web app with anyone outside your home network, you can use a free Cloudflare Tunnel or ngrok:

**Using Cloudflare Tunnel (Free, No Account Needed):**
```bash
winget install Cloudflare.cloudflared
cloudflared tunnel --url http://localhost:8501
```
It gives you a public HTTPS URL (e.g. `https://xxxx.trycloudflare.com`) that you can send on WhatsApp to anyone!

---

## 🔑 API Keys Configured

The app is pre-configured with operational keys in `config.py`:
- `DATA_GOV_IN_API_KEY`: Ministry of Agriculture Agmarknet Resource API.
- `GROQ_API_KEY`: Groq ultra-low latency inference for Whisper-large-v3 and Qwen 3.8-27B.

---

## 🛡️ Zero Dependency Requirement

Built entirely using Python's standard library (`http.server`, `socketserver.ThreadingMixIn`, `urllib.request`, `sqlite3`, `json`). It requires **zero pip package installations**, eliminating C-compiler issues or binary wheel mismatches on any version of Python (including Python 3.14).
