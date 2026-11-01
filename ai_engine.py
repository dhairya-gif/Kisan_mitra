"""
ai_engine.py - Intelligent Agricultural LLM Reasoning Engine
Powered by Groq High-Speed Inference (Qwen 3.8-27B / Llama 3.3)
Answers strictly what is asked, in the exact language (Hinglish, Hindi, Punjabi, Telugu, English).
"""

import json
import urllib.request
import urllib.parse
from typing import Dict, Any, Optional
from config import GROQ_API_KEY, GROQ_CHAT_MODEL

def query_groq_llm(messages: list, max_tokens: int = 150) -> Optional[str]:
    """Queries Groq Chat Completion API using Python's standard library."""
    if not GROQ_API_KEY:
        return None

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    }
    payload = {
        "model": GROQ_CHAT_MODEL,
        "messages": messages,
        "temperature": 0.3,  # Low temperature for factual precision
        "max_tokens": max_tokens,
    }

    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        return None


def detect_query_language(text: str, default_lang: str = "en") -> str:
    """Detects whether user query is Hinglish, Hindi, Punjabi, Telugu, or English."""
    t = text.strip()
    # Check for Gurmukhi (Punjabi) characters
    if any("\u0a00" <= c <= "\u0a7f" for c in t):
        return "pa"
    # Check for Telugu characters
    if any("\u0c00" <= c <= "\u0c7f" for c in t):
        return "te"
    # Check for Devanagari (Hindi) characters
    if any("\u0900" <= c <= "\u097f" for c in t):
        return "hi"

    # Check for Hinglish keywords in Roman script
    hinglish_markers = [
        "kya", "bhai", "aaj", "kal", "pani", "paani", "barish", "baarish", "khet", "fasal",
        "kitna", "bhav", "bhaav", "rate", "lagaye", "lagana", "hoga", "hogi", "kab", "kaise",
        "spray", "kare", "karna", "gehu", "dhan", "chawal", "aloo", "pyaz", "sarso", "suno", "namaste"
    ]
    t_lower = t.lower()
    if any(f" {w} " in f" {t_lower} " for w in hinglish_markers):
        return "hinglish"

    # Check for Punjabi in Roman script
    punjabi_roman = ["ki", "ajj", "kalh", "mee", "pani", "khet", "kanak", "jhona", "da", "di", "daso", "laiye"]
    if any(f" {w} " in f" {t_lower} " for w in punjabi_roman):
        return "pa"

    return default_lang


def get_ai_answer(report: dict, question: str, user_lang: str = "en") -> str:
    """
    Delivers intelligent, hyper-targeted answers strictly addressing what was asked.
    Understands nuanced phrasing and matches the language:
      - Hinglish query -> Hinglish answer
      - Hindi query -> Hindi answer
      - Punjabi query -> Punjabi answer
      - Telugu query -> Telugu answer
      - English query -> English answer
    """
    q_lang = detect_query_language(question, default_lang=user_lang)

    dist = report.get("district", "Your District")
    state = report.get("state", "India")
    crop = report.get("commodity", "Crop")
    w = report.get("weather", {})
    s = report.get("soil", {})
    m = report.get("mandi", {})

    alerts = report.get("alerts", [])
    yield_est = report.get("yield_estimate", {})
    alert_str = "; ".join([f"{a['condition']} ({a['severity']}): {a['detail']} - {a['advisory']}" for a in alerts]) if alerts else "None (All clear, conditions favorable)"
    yield_str = f"Estimated {yield_est.get('estimated_yield_q_ha', '--')} qt/ha (Rating: {yield_est.get('rating', 'Normal')}, Genetic Baseline: {yield_est.get('baseline_yield_q_ha', '--')} qt/ha)" if yield_est else "N/A"

    # Build concise real-time context
    context_str = (
        f"Real-Time Data for {dist}, {state} (Date: Today):\n"
        f"- Target Crop: {crop}\n"
        f"- Temperature: {w.get('temperature_c', 28)}°C | Humidity: {w.get('humidity_pct', 60)}% | Wind: {w.get('wind_speed_kph', 12)} kph\n"
        f"- Rain Today: {w.get('precipitation_now_mm', 0)} mm | Forecast Next 24h: {w.get('next_24h_rainfall_forecast_mm', 0)} mm\n"
        f"- Root-zone Soil Moisture (3-9cm): {s.get('rootzone_moisture_pct', 25)}% (Status: {s.get('soil_status', 'Normal')})\n"
        f"- Topsoil Moisture (0-1cm): {s.get('topsoil_moisture_pct', 20)}% | Surface Temp: {s.get('soil_temp_surface_c', 26)}°C\n"
        f"- 14-Day Rain Forecast Total: {s.get('forecast_14d_rainfall_mm', 0)} mm\n"
        f"- APMC Mandi Modal Price for {crop}: Rs. {m.get('modal_price', 'N/A')} per {m.get('unit', 'Quintal')} (Range: Rs. {m.get('min_price', 'N/A')} - {m.get('max_price', 'N/A')} at {m.get('market', dist)}).\n"
        f"- Active Adverse Weather Advisories: {alert_str}\n"
        f"- Dynamic Crop Yield Projection: {yield_str}."
    )

    system_instruction = (
        "You are 'Kisan Mitra', a friendly, highly intelligent agricultural expert assistant for Indian farmers.\n"
        "STRICT GUIDELINES:\n"
        "1. ANSWER ONLY WHAT WAS ASKED: If the farmer asks only about rain, answer ONLY about rain. "
        "If asked about watering/irrigation, answer ONLY about irrigation. If asked about mandi price, answer ONLY about mandi price. "
        "DO NOT dump unrelated weather stats or crop rates unless explicitly asked!\n"
        "2. LANGUAGE MATCHING:\n"
        "   - If the user asks in Hinglish (e.g. 'Bhai kal pani lagaye kya?'), respond in friendly, natural Hinglish!\n"
        "   - If the user asks in Hindi, respond in pure Hindi (Devanagari script).\n"
        "   - If the user asks in Punjabi, respond in pure Punjabi (Gurmukhi script).\n"
        "   - If the user asks in Telugu, respond in Telugu (Telugu script).\n"
        "   - If English, respond in clear English.\n"
        "3. ADVICE PRECISION: Base all advice strictly on the live district numbers provided. "
        "Keep the response crisp: 1 to 3 sentences maximum, warmly addressing the farmer.\n"
    )

    messages = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": f"Live District Context:\n{context_str}\n\nFarmer's Question: \"{question}\"\nDetected Language Style: {q_lang}"}
    ]

    llm_reply = query_groq_llm(messages, max_tokens=140)
    if llm_reply:
        return llm_reply

    # -----------------------------------------------------------------------
    # Resilient Rule Fallback (if Groq API is offline)
    # -----------------------------------------------------------------------
    return _rule_based_fallback(report, question, q_lang)


def _rule_based_fallback(report: dict, question: str, lang: str) -> str:
    """Concise fallback rule parser answering strictly what was asked."""
    q = question.lower()
    dist = report.get("district", "Ludhiana")
    w = report.get("weather", {})
    s = report.get("soil", {})
    m = report.get("mandi", {})
    crop = report.get("commodity", "Crop")

    moisture = s.get("rootzone_moisture_pct", 25.0)
    rain_24h = w.get("next_24h_rainfall_forecast_mm", 0.0)
    rain_14d = s.get("forecast_14d_rainfall_mm", 0.0)
    modal_p = m.get("modal_price", "N/A")

    is_rain = any(k in q for k in ["rain", "barish", "baarish", "mee", "ਮੀਂਹ", "बारिश", "వర్షం"])
    is_irrigation = any(k in q for k in ["irrigate", "irrigation", "water", "pani", "paani", "सिंचाई", "पानी", "ਪਾਣੀ", "నీరు"])
    is_spray = any(k in q for k in ["spray", "pesticide", "fertilizer", "कीटनाशक", "ਸਪਰੇਅ", "మందులు"])
    is_price = any(k in q for k in ["price", "mandi", "rate", "cost", "bhav", "bhaav", "भाव", "ਰੇਟ", "ధర"])
    is_harvest = any(k in q for k in ["harvest", "sow", "sowing", "कटाई", "बुवाई", "ਬਿਜਾਈ", "ਕਟਾਈ", "కోత"])
    is_yield = any(k in q for k in ["yield", "production", "jhaad", "paidaawar", "paidaavar", "पैदावार", "ਝਾੜ", "దిగుబడి"])
    is_alert = any(k in q for k in ["alert", "warning", "danger", "khatra", "चेतावनी", "ਖ਼ਤਰਾ", "హెచ్చరిక"])

    alerts = report.get("alerts", [])
    yield_est = report.get("yield_estimate", {})
    y_val = yield_est.get("estimated_yield_q_ha", "35-45")
    y_rating = yield_est.get("rating", "Normal")

    if lang == "hinglish":
        if is_yield:
            return f"Bhai, vartamaan mausam ke hisab se {crop} ki anumanit paidaawar lagbhag {y_val} quintal prati hectare ({y_rating}) rahne ka anuman hai."
        if is_alert:
            return f"Chetawani: {alerts[0]['condition']} - {alerts[0]['advisory']}" if alerts else "Abhi mausam me koi gambhir khatra nahi hai, sthiti anukool hai."
        if is_rain:
            return f"{dist} me agle 24 ghante me {rain_24h} mm barish ka anuman hai." if rain_24h > 0 else f"{dist} me agle 24 ghante me barish ke asaar nahi hain, mausam saaf rahega."
        if is_irrigation:
            return f"Nahi bhai, abhi paani mat lagao. {dist} me agle 24 ghante me {rain_24h} mm barish hone wali hai." if rain_24h > 5 else (f"Haan, zameen me nami kam hai ({moisture}%), halke paani ki zarurat hai." if moisture < 18 else f"Abhi paani lagane ki zarurat nahi hai, rootzone moisture {moisture}% par bilkul theek hai.")
        if is_spray:
            return f"Nahi, abhi spray mat karo. Barish ke karan dawa beh jayegi." if rain_24h > 1.5 else f"Haan, mausam saaf hai, subah ya shaam ke waqt spray kar sakte ho."
        if is_price:
            return f"{dist} mandi me {crop} ka modal rate Rs. {modal_p} per quintal chal raha hai."
        if is_harvest:
            return f"Agle 14 dino me {rain_14d} mm barish ka anuman hai. Agar fasal pakk gayi hai to mausam dekh kar katai karein."

    if lang == "hi":
        if is_rain:
            return f"{dist} में अगले 24 घंटों में {rain_24h} मिमी बारिश का अनुमान है।" if rain_24h > 0 else f"{dist} में अगले 24 घंटों में बारिश की संभावना नहीं है, मौसम साफ रहेगा।"
        if is_irrigation:
            return f"सिंचाई न करें: {dist} में {rain_24h} मिमी बारिश होने वाली है।" if rain_24h > 5 else (f"हल्की सिंचाई करें: जड़ क्षेत्र में नमी कम ({moisture}%) है।" if moisture < 18 else f"अभी सिंचाई की आवश्यकता नहीं है, नमी ({moisture}%) पर्याप्त है।")
        if is_spray:
            return f"आज कीटनाशक का छिड़काव न करें, बारिश का जोखिम है।" if rain_24h > 1.5 else f"छिड़काव के लिए मौसम साफ और अनुकूल है।"
        if is_price:
            return f"{dist} मंडी में {crop} का मॉडल भाव Rs. {modal_p} प्रति क्विंटल है।"

    if lang == "pa":
        if is_rain:
            return f"{dist} ਵਿੱਚ ਅਗਲੇ 24 ਘੰਟਿਆਂ 'ਚ {rain_24h} mm ਮੀਂਹ ਪੈ ਸਕਦਾ ਹੈ।" if rain_24h > 0 else f"{dist} ਵਿੱਚ ਅਗਲੇ 24 ਘੰਟਿਆਂ ਵਿੱਚ ਮੀਂਹ ਦੀ ਕੋਈ ਸੰਭਾਵਨਾ ਨਹੀਂ ਹੈ।"
        if is_irrigation:
            return f"ਪਾਣੀ ਨਾ ਲਾਓ: {dist} ਵਿੱਚ {rain_24h} mm ਮੀਂਹ ਦਾ ਅਨੁਮਾਨ ਹੈ।" if rain_24h > 5 else (f"ਪਾਣੀ ਲਾਓ: ਜ਼ਮੀਨ ਵਿੱਚ ਨਮੀ ਘੱਟ ({moisture}%) ਹੈ।" if moisture < 18 else f"ਹੁਣ ਪਾਣੀ ਲਾਉਣ ਦੀ ਲੋੜ ਨਹੀਂ, ਨਮੀ {moisture}% ਬਿਲਕੁਲ ਠੀਕ ਹੈ।")
        if is_spray:
            return f"ਅੱਜ ਸਪਰੇਅ ਨਾ ਕਰੋ, ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ ਹੈ।" if rain_24h > 1.5 else f"ਸਪਰੇਅ ਲਈ ਮੌਸਮ ਸਾਫ਼ ਹੈ।"
        if is_price:
            return f"{dist} ਮੰਡੀ ਵਿੱਚ {crop} ਦਾ ਸਰਕਾਰੀ ਭਾਅ Rs. {modal_p} ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਹੈ।"

    # Default English
    if is_rain:
        return f"{rain_24h} mm of rainfall is forecasted for {dist} in the next 24 hours." if rain_24h > 0 else f"No rainfall is expected in {dist} over the next 24 hours. Weather will be clear."
    if is_irrigation:
        return f"Hold irrigation: {rain_24h} mm rainfall is forecasted in {dist}." if rain_24h > 5 else (f"Irrigate now: Rootzone moisture is critically low at {moisture}%." if moisture < 18 else f"No irrigation needed: Rootzone moisture is optimal at {moisture}%.")
    if is_spray:
        return f"Do not spray today: Expected rainfall ({rain_24h} mm) will wash chemicals away." if rain_24h > 1.5 else f"Weather is favorable for chemical spraying."
    if is_price:
        return f"Current modal price for {crop} at {dist} APMC is Rs. {modal_p} / Quintal."

    return f"In {dist}, temperature is {w.get('temperature_c', 28)}°C, soil moisture is {moisture}%, and {crop} Mandi rate is Rs. {modal_p}."
