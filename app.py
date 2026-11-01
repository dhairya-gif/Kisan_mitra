"""
app.py - Lightweight Multilingual Agritech Voice & Text Web Assistant
Built with Streamlit for Climate, Resource Infrastructure & Global Supply Resilience.

Features:
  - 🎤 Mic input -> Voice reply (audio playback) + Text reply (Hindi, Punjabi, Telugu).
  - ⌨️ Text box -> Text-only answer.
  - 🌦️ Live District Weather, Soil Moisture & Mandi Price Dashboard (Zero Dummy Data).
"""

import os
import sys
import json
import urllib.request
import urllib.parse
from pathlib import Path
from datetime import datetime
import streamlit as st

# Import the live data fetcher engine
try:
    from agritech_assistant.data_fetcher import (
        resolve_district,
        fetch_district_weather_and_soil,
        fetch_district_mandi_price,
        get_district_complete_report,
        transcribe_audio,
        extract_district_from_query,
        SUPPORTED_LANGUAGES,
        DEFAULT_LATITUDE,
        DEFAULT_LONGITUDE,
    )
except ImportError:
    from data_fetcher import (
        resolve_district,
        fetch_district_weather_and_soil,
        fetch_district_mandi_price,
        get_district_complete_report,
        transcribe_audio,
        extract_district_from_query,
        SUPPORTED_LANGUAGES,
        DEFAULT_LATITUDE,
        DEFAULT_LONGITUDE,
    )

# ---------------------------------------------------------------------------
# Streamlit Page Config & Custom Agri Styling
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="Kisan Mitra - Agritech Assistant",
    page_icon="🌾",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    .main-header { font-size: 2.3rem; font-weight: 700; color: #2e7d32; margin-bottom: 0px; }
    .sub-header { font-size: 1.05rem; color: #555; margin-bottom: 20px; }
    .metric-card {
        background: #f9fbf9; border: 1px solid #c8e6c9; border-radius: 10px;
        padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 12px;
    }
    .voice-reply-box {
        background: #e8f5e9; border-left: 5px solid #43a047;
        padding: 15px; border-radius: 5px; margin-top: 10px; margin-bottom: 15px;
    }
    .text-reply-box {
        background: #f1f8e9; border-left: 5px solid #8bc34a;
        padding: 15px; border-radius: 5px; margin-top: 10px; margin-bottom: 15px;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# ---------------------------------------------------------------------------
# Text-To-Speech Engine (Zero-Package Built-in Audio Synthesis)
# ---------------------------------------------------------------------------
def generate_voice_bytes(text: str, lang: str = "hi") -> bytes:
    """Generates MP3 audio for voice replies in Hindi, Punjabi, or Telugu."""
    clean_text = (
        text.replace("*", "")
        .replace("#", "")
        .replace("📍", "")
        .replace("✅", "")
        .replace("❌", "")
        .replace("⚠️", "")
        .replace("💰", "")
        .strip()
    )
    snippet = clean_text[:220]
    tts_url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={urllib.parse.quote(snippet)}&tl={lang}&client=tw-ob"
    req = urllib.request.Request(tts_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.read()
    except Exception:
        return b""


# ---------------------------------------------------------------------------
# Multilingual Advisory Generator (Hindi, Punjabi, Telugu, English)
# ---------------------------------------------------------------------------
def generate_multilingual_advisory(report: dict, question: str, lang: str = "en") -> str:
    """Delivers protective agricultural advice in the farmer's native dialect."""
    q = question.lower()
    dist = report["district"]
    w = report["weather"]
    s = report["soil"]
    m = report["mandi"]
    crop = report["commodity"]

    moisture = s["rootzone_moisture_pct"]
    rain_24h = w["next_24h_rainfall_forecast_mm"]
    rain_14d = s["forecast_14d_rainfall_mm"]
    temp = w["temperature_c"]
    modal_p = m.get("modal_price", "N/A")

    is_irrigation = any(k in q for k in ["irrigate", "irrigation", "water", "paani", "सिंचाई", "पानी", "ਨੀਰੁ", "ਨੀਂਹ", "నీరు"])
    is_spray = any(k in q for k in ["spray", "pesticide", "fertilizer", "कीटनाशक", "ਸਪਰੇਅ", "ਮੰਦੂਲੁ", "మందులు"])
    is_price = any(k in q for k in ["price", "mandi", "rate", "cost", "भाव", "ਰੇਟ", "ధర"])
    is_harvest = any(k in q for k in ["harvest", "sow", "sowing", "planting", "कटाई", "बुवाई", "ਬਿਜਾਈ", "ਕਟਾਈ", "కోత", "సాగు"])

    # 1. PUNJABI (ਪੰਜਾਬੀ)
    if lang == "pa":
        if is_irrigation:
            if rain_24h > 5.0:
                return f"❌ ਪਾਣੀ ਨਾ ਲਾਓ: {dist} ਵਿੱਚ ਅਗਲੇ 24 ਘੰਟਿਆਂ 'ਚ {rain_24h} mm ਮੀਂਹ ਪੈਣ ਦੀ ਸੰਭਾਵਨਾ ਹੈ। ਵਾਧੂ ਪਾਣੀ ਨਾਲ ਫ਼ਸਲ ਖ਼ਰਾਬ ਹੋ ਸਕਦੀ ਹੈ।"
            elif moisture < 18.0:
                return f"✅ ਪਾਣੀ ਲਾਉਣ ਦੀ ਲੋੜ ਹੈ: {dist} ਵਿੱਚ ਜ਼ਮੀਨ ਦੀ ਨਮੀ ਘੱਟ ਕੇ {moisture}% ਰਹਿ ਗਈ ਹੈ। ਤੁਰੰਤ ਹਲਕਾ ਪਾਣੀ ਲਾਓ।"
            return f"ℹ️ ਜ਼ਮੀਨ ਵਿੱਚ ਨਮੀ ਠੀਕ ਹੈ ({moisture}%)। {dist} ਵਿੱਚ ਅੱਜ ਪਾਣੀ ਲਾਉਣ ਦੀ ਲੋੜ ਨਹੀਂ।"
        elif is_spray:
            if rain_24h > 1.5:
                return f"❌ ਅੱਜ ਸਪਰੇਅ ਨਾ ਕਰੋ: {dist} ਵਿੱਚ ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ ਹੈ, ਦਵਾਈ ਵਹਿ ਜਾਵੇਗੀ।"
            return f"✅ ਸਪਰੇਅ ਲਈ ਮੌਸਮ ਸਾਫ਼ ਹੈ। ਧੁੱਪ ਨਿਕਲਣ ਤੋਂ ਪਹਿਲਾਂ ਜਾਂ ਸ਼ਾਮ ਵੇਲੇ ਸਪਰੇਅ ਕਰੋ।"
        elif is_price:
            return f"💰 {crop} ਮੰਡੀ ਭਾਅ: {dist} (ਮੰਡੀ: {m.get('market', dist)}) ਵਿੱਚ ਸਰਕਾਰੀ ਔਸਤ ਰੇਟ Rs. {modal_p} ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਹੈ।"
        elif is_harvest:
            return f"🌾 ਕਟਾਈ ਅਤੇ ਬਿਜਾਈ ਸਲਾਹ: {dist} ਵਿੱਚ ਅਗਲੇ 14 ਦਿਨਾਂ 'ਚ {rain_14d} mm ਮੀਂਹ ਦਾ ਅਨੁਮਾਨ ਹੈ। ਕਟਾਈ ਲਈ ਮੌਸਮ ਅਨੁਕੂਲ ਹੈ।"
        return f"📍 {dist} ਰਿਪੋਰਟ: ਤਾਪਮਾਨ {temp}°C, ਜ਼ਮੀਨ ਦੀ ਨਮੀ {moisture}%, {crop} ਮੰਡੀ ਰੇਟ Rs. {modal_p} / ਕੁਇੰਟਲ।"

    # 2. HINDI (हिन्दी)
    elif lang == "hi":
        if is_irrigation:
            if rain_24h > 5.0:
                return f"❌ आज सिंचाई न करें: {dist} में अगले 24 घंटों में {rain_24h} मिमी बारिश का अनुमान है। खेत में जलभराव से बचें।"
            elif moisture < 18.0:
                return f"✅ सिंचाई की आवश्यकता है: {dist} में जड़ क्षेत्र की नमी केवल {moisture}% है। तुरंत हल्की सिंचाई करें।"
            return f"ℹ️ मिट्टी में नमी पर्याप्त है ({moisture}%)। {dist} में आज सिंचाई की आवश्यकता नहीं है।"
        elif is_spray:
            if rain_24h > 1.5:
                return f"❌ आज कीटनाशक का छिड़काव न करें: बारिश से दवा बह जाएगी और नुकसान होगा।"
            return f"✅ मौसम साफ है: सुबह या शाम के समय कीटनाशक का छिड़काव सुरक्षित है।"
        elif is_price:
            return f"💰 {crop} मंडी भाव: {dist} (मंडी: {m.get('market', dist)}) में मॉडल भाव Rs. {modal_p} प्रति क्विंटल है।"
        elif is_harvest:
            return f"🌾 कटाई/बुवाई सलाह: अगले 14 दिनों में कुल {rain_14d} मिमी बारिश का अनुमान है। कटी हुई फसल को सुरक्षित रखें।"
        return f"📍 {dist} रिपोर्ट: तापमान {temp}°C, मिट्टी की नमी {moisture}%, {crop} भाव Rs. {modal_p} प्रति क्विंटल।"

    # 3. TELUGU (తెలుగు)
    elif lang == "te":
        if is_irrigation:
            if rain_24h > 5.0:
                return f"❌ నీరు పెట్టవద్దు: {dist} లో రాబోయే 24 గంటల్లో {rain_24h} మి.మీ వర్షం పడే అవకాశం ఉంది."
            elif moisture < 18.0:
                return f"✅ తడి ఇవ్వాలి: {dist} లో వేరు మండల తేమ {moisture}% మాత్రమే ఉంది. వెంటనే నీరు పెట్టండి."
            return f"ℹ️ నేలలో తగినంత తేమ ఉంది ({moisture}%)। ఈరోజు నీరు అవసరం లేదు."
        elif is_spray:
            if rain_24h > 1.5:
                return f"❌ మందులు పిచికారీ చేయవద్దు: వర్షం కారణంగా మందు కొట్టుకుపోతుంది."
            return f"✅ పిచికారీకి వాతావరణం అనుకూలంగా ఉంది."
        elif is_price:
            return f"💰 {crop} మార్కెట్ ధర: {dist} మార్కెట్లో క్వింటాలుకు సగటు ధర రూ. {modal_p}."
        elif is_harvest:
            return f"🌾 పంట కోత సలహా: రాబోయే 14 రోజుల్లో {rain_14d} మి.మీ వర్షం సూచన ఉంది."
        return f"📍 {dist} సమాచారం: ఉష్ణోగ్రత {temp}°C, తేమ {moisture}%, {crop} ధర రూ. {modal_p}."

    # 4. ENGLISH DEFAULT
    else:
        if is_irrigation:
            if rain_24h > 5.0:
                return f"❌ DO NOT IRRIGATE in {dist}: {rain_24h} mm rainfall is forecasted in the next 24 hours. Extra watering will cause root waterlogging."
            elif moisture < 18.0:
                return f"✅ IRRIGATION NEEDED in {dist}: Rootzone moisture is critically low at {moisture}%. Apply light irrigation immediately."
            return f"ℹ️ OPTIMAL MOISTURE: Rootzone moisture in {dist} is {moisture}%. No irrigation needed today."
        elif is_spray:
            if rain_24h > 1.5:
                return f"❌ AVOID SPRAYING TODAY in {dist}: Forecasted rain ({rain_24h} mm) will wash chemicals away."
            return f"✅ SAFE TO SPRAY in {dist}: Weather is dry and clear. Apply in the early morning or evening."
        elif is_price:
            return f"💰 MANDI PRICE in {dist}: Current modal price for {crop} at {m.get('market', dist)} is Rs. {modal_p} / Quintal."
        elif is_harvest:
            return f"🌾 SOWING/HARVEST WINDOW for {dist}: 14-day rainfall outlook is {rain_14d} mm. Sowing is ideal when topsoil moisture is 20-35%."
        return f"📍 REPORT FOR {dist}: Temp {temp}°C, Soil Moisture {moisture}%, {crop} Mandi Price Rs. {modal_p} / Quintal."


# ---------------------------------------------------------------------------
# Sidebar: Location & Crop Configuration
# ---------------------------------------------------------------------------
with st.sidebar:
    st.image("https://img.icons8.com/color/96/tractor.png", width=65)
    st.title("🌾 Settings")
    st.markdown("Set your target agricultural district and preferred language.")

    district_input = st.text_input("Enter Indian District Name:", value="Ludhiana", help="e.g. Ludhiana, Guntur, Patna, Nashik, Karnal, Indore")
    crop_input = st.selectbox("Select Crop:", ["Wheat", "Paddy", "Potato", "Onion", "Mustard", "Cotton"], index=0)

    st.markdown("---")
    st.subheader("🌐 Preferred Voice Language")
    lang_name = st.radio(
        "Choose spoken language for voice replies:",
        ["Hindi (हिन्दी)", "Punjabi (ਪੰਜਾਬੀ)", "Telugu (తెలుగు)", "English"],
        index=0,
    )
    lang_code_map = {
        "Hindi (हिन्दी)": "hi",
        "Punjabi (ਪੰਜਾਬੀ)": "pa",
        "Telugu (తెలుగు)": "te",
        "English": "en",
    }
    selected_lang = lang_code_map[lang_name]

    st.markdown("---")
    st.caption("Zero Dummy Data Policy Compliant | IMD, Open-Meteo & Data.gov.in Live APIs")


# ---------------------------------------------------------------------------
# Main App Header & Live District Context Ingestion
# ---------------------------------------------------------------------------
st.markdown("<div class='main-header'>🌾 Kisan Mitra: Agritech & Resource Advisory</div>", unsafe_allow_html=True)
st.markdown("<div class='sub-header'>Climate, Resource Infrastructure & Global Supply Resilience Platform</div>", unsafe_allow_html=True)

@st.cache_data(ttl=600, show_spinner=False)
def load_live_data(dist: str, crop: str):
    return get_district_complete_report(dist, commodity=crop)

try:
    with st.spinner(f"📡 Fetching live satellite & APMC mandi metrics for {district_input}..."):
        report = load_live_data(district_input, crop_input)
except Exception as e:
    st.error(f"Error fetching live data for '{district_input}': {e}")
    st.stop()

# ---------------------------------------------------------------------------
# Visual District Dashboard (Weather, Soil, Mandi Cards)
# ---------------------------------------------------------------------------
col1, col2, col3 = st.columns(3)

with col1:
    st.markdown(
        f"""
        <div class='metric-card'>
            <h4>🌦️ Live Weather ({report['district']})</h4>
            <h2 style='color:#1b5e20; margin:0;'>{report['weather']['temperature_c']} °C</h2>
            <p style='margin:0;'><b>Humidity:</b> {report['weather']['humidity_pct']}% | <b>Rain Today:</b> {report['weather']['precipitation_now_mm']} mm</p>
            <p style='color:#d84315; font-size:0.9rem; margin-top:5px;'><b>24h Forecast:</b> {report['weather']['next_24h_rainfall_forecast_mm']} mm rain</p>
            <span style='font-size:0.85rem; color:#666;'>{report['weather']['advisory']}</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

with col2:
    st.markdown(
        f"""
        <div class='metric-card'>
            <h4>🌱 Live Soil Metrics (Rootzone)</h4>
            <h2 style='color:#2e7d32; margin:0;'>{report['soil']['rootzone_moisture_pct']} %</h2>
            <p style='margin:0;'><b>Topsoil (0-1cm):</b> {report['soil']['topsoil_moisture_pct']}% | <b>Soil Temp:</b> {report['soil']['soil_temp_surface_c']}°C</p>
            <p style='color:#0277bd; font-size:0.9rem; margin-top:5px;'><b>14-Day Rain Total:</b> {report['soil']['forecast_14d_rainfall_mm']} mm</p>
            <span style='font-size:0.85rem; color:#666;'><b>Status:</b> {report['soil']['soil_status']}</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

with col3:
    m_price = report['mandi'].get('modal_price', 'N/A')
    st.markdown(
        f"""
        <div class='metric-card'>
            <h4>💰 APMC Mandi ({report['commodity']})</h4>
            <h2 style='color:#e65100; margin:0;'>Rs. {m_price}</h2>
            <p style='margin:0;'><b>Market:</b> {report['mandi'].get('market', report['district'])}</p>
            <p style='font-size:0.9rem; margin-top:5px;'><b>State:</b> {report['state']} | <b>Unit:</b> Rs/Quintal</p>
            <span style='font-size:0.85rem; color:#666;'><b>Date:</b> {report['mandi'].get('arrival_date', 'Live Today')}</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

st.markdown("---")

# ---------------------------------------------------------------------------
# SECTION 1: 🎤 MICROPHONE INPUT (VOICE REPLY + TEXT REPLY)
# ---------------------------------------------------------------------------
st.subheader("🎤 Voice Assistant (Click to Speak)")
st.caption(f"Click the microphone to record your question in {lang_name}. You will receive BOTH a Voice Reply (Audio) and a Text Reply.")

audio_file = None
if hasattr(st, "audio_input"):
    audio_file = st.audio_input(f"🎙️ Speak question in {lang_name} (e.g., 'सिंचाई कब करें?', 'ਕਣਕ ਦਾ ਭਾਅ', 'వర్షం పడుతుందా?')")
else:
    audio_file = st.file_uploader("Upload audio file (.wav/.mp3)", type=["wav", "mp3", "m4a", "ogg"])

if audio_file is not None:
    audio_bytes = audio_file.read()
    with st.spinner("⏳ Transcribing speech using Groq Whisper-large-v3..."):
        try:
            stt_result = transcribe_audio(audio_bytes, language=selected_lang)
            spoken_text = stt_result["transcript"]
            st.markdown(f"**🗣️ You Said ({stt_result['language_name']}):** *\"{spoken_text}\"*")
            
            detected_district = extract_district_from_query(spoken_text)
            active_report = report
            if detected_district and detected_district.lower() != report["district"].lower():
                st.info(f"📍 Detected new district from voice: **{detected_district}**. Fetching live data...")
                active_report = load_live_data(detected_district, crop_input)
            
            answer = generate_multilingual_advisory(active_report, spoken_text, lang=selected_lang)
            
            st.markdown(
                f"""
                <div class='voice-reply-box'>
                    <h4 style='color:#1b5e20; margin-top:0;'>💬 Assistant Text Reply:</h4>
                    <p style='font-size:1.1rem; margin:0;'>{answer}</p>
                </div>
                """,
                unsafe_allow_html=True,
            )
            
            with st.spinner("🔊 Generating regional voice response..."):
                voice_reply_bytes = generate_voice_bytes(answer, lang=selected_lang)
                if voice_reply_bytes:
                    st.markdown("**🔊 Listen to Voice Reply:**")
                    st.audio(voice_reply_bytes, format="audio/mp3", autoplay=True)
                    
        except Exception as err:
            st.error(f"Voice Processing Error: {err}")

st.markdown("---")

# ---------------------------------------------------------------------------
# SECTION 2: ⌨️ TYPING BOX (TEXT-ONLY REPLY)
# ---------------------------------------------------------------------------
st.subheader("⌨️ Ask by Typing (Text Answer Only)")
st.caption("Type any question about your district. The answer will be delivered in Text form only (no audio generated).")

st.markdown("**Quick Question Shortcuts:**")
q_col1, q_col2, q_col3, q_col4 = st.columns(4)
quick_query = None

if q_col1.button("💧 Should I irrigate today?"):
    quick_query = "Should I irrigate today?"
if q_col2.button("🧪 Can I spray pesticide?"):
    quick_query = "Is it safe to spray pesticides?"
if q_col3.button("🌾 When is the harvest window?"):
    quick_query = "What is the harvesting and sowing window?"
if q_col4.button(f"💵 Mandi price of {crop_input}"):
    quick_query = f"What is the mandi price of {crop_input}?"

typed_query = st.chat_input(f"Type your question about {report['district']} (e.g., 'Will it rain?', 'Crop advice', 'Mandi rate')...")
active_query = typed_query or quick_query

if active_query:
    st.markdown(f"**📝 Your Question:** *\"{active_query}\"*")
    with st.spinner("Analyzing live district metrics..."):
        text_only_answer = generate_multilingual_advisory(report, active_query, lang=selected_lang)
        st.markdown(
            f"""
            <div class='text-reply-box'>
                <h4 style='color:#33691e; margin-top:0;'>📄 Text Answer:</h4>
                <p style='font-size:1.1rem; margin:0;'>{text_only_answer}</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

st.markdown("<br><hr><center style='color:#888; font-size:0.85rem;'>Kisan Mitra • Zero Dummy Data Policy Compliant • Powered by Open-Meteo, IMD, Data.gov.in & Groq Whisper</center>", unsafe_allow_html=True)
