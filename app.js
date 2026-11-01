/**
 * app.js - Kisan Mitra Client-side Application Logic
 * Multilingual Switching, Device GPS, Voice Recognition STT & Audio TTS,
 * Telemetry Dashboard, Adverse Weather Alerts, and Crop Yield Estimator.
 */

let currentLang = "en";
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let latestDashboardData = null;

// Embedded translation dictionaries (keeps interface responsive immediately)
let UI_TRANSLATIONS = {
  "en": {
    "app_title": "Kisan Mitra",
    "app_badge": "Agritech & Climate Resilience",
    "app_subtitle": "Real-time AI voice & advisory assistant for extreme climate defense and market intelligence.",
    "nav_dashboard": "Dashboard",
    "nav_settings": "District Settings",
    "lbl_district": "Target District:",
    "lbl_crop": "Selected Crop:",
    "lbl_language": "Interface Language:",
    "lbl_system_status": "System Status",
    "status_connected": "Connected",
    "status_not_connected": "Not Connected",
    "btn_update": "Refresh District Data",
    "btn_gps": "📍 Use Device Location",
    "btn_voice_loc": "🎤 Speak District",
    "theme_light": "Light Mode",
    "theme_dark": "Dark Mode",
    "card_weather_title": "🌦️ Live Weather",
    "card_soil_title": "🌱 Soil Health (Rootzone)",
    "card_mandi_title": "💰 APMC Mandi Price",
    "section_alerts_title": "🚨 Autonomous Adverse-Weather Advisories",
    "section_alerts_empty": "✅ All Clear: No adverse weather or soil alerts currently detected. Conditions are favorable.",
    "section_yield_title": "📊 Dynamic Crop Yield Estimator",
    "lbl_baseline_yield": "Baseline Genetic Yield",
    "lbl_estimated_yield": "Estimated Current Yield",
    "lbl_yield_rating": "Yield Rating",
    "lbl_yield_progress": "Genetic Potential Realized",
    "lbl_yield_factors": "Agronomic Impact Factors Breakdown",
    "lbl_humidity": "Humidity",
    "lbl_rain_today": "Rain Today",
    "lbl_forecast_24h": "Next 24h Rain",
    "lbl_topsoil": "Topsoil (0-1cm)",
    "lbl_soil_temp": "Surface Temp",
    "lbl_forecast_14d": "14-Day Rain Total",
    "lbl_soil_status": "Soil Status",
    "lbl_market": "Market Yard",
    "lbl_arrival_date": "Arrival Date",
    "unit_price": "Rs / Quintal",
    "voice_title": "🎤 Multilingual Voice Assistant",
    "voice_subtitle": "Click mic to speak in Hindi, Punjabi, Telugu, or English. You get a Voice Reply + Text Reply.",
    "mic_idle": "Click Microphone to Speak",
    "mic_listening": "Listening... Speak now!",
    "mic_processing": "Transcribing with Whisper Large v3...",
    "typing_title": "⌨️ Ask Question (Text-Only Answer)",
    "typing_subtitle": "Type your question. The AI answers strictly what you asked in Text form only.",
    "typing_placeholder": "Ask a question (e.g. 'Should I irrigate today in {district}?', 'Mandi price of wheat')...",
    "btn_send": "Ask AI",
    "chip_irrigation": "💧 Should I irrigate today?",
    "chip_spray": "🧪 Safe to spray pesticide?",
    "chip_harvest": "🌾 Sowing & harvest window?",
    "chip_price": "💵 What is the Mandi price?",
    "lbl_range": "Range:",
    "lbl_optimal_potential": "Optimal genetic potential",
    "lbl_realized_potential": "{pct}% of genetic potential",
    "lbl_rating_based": "Based on current telemetry",
    "lbl_crop_badge": "Crop: {crop}",
    "lbl_expand_factors": "Expand Factors ▼",
    "lbl_action_plan": "Action Plan ▼",
    "lbl_step_by_step_plan": "📋 Step-by-Step Action Plan:",
    "lbl_danger": "🚨 DANGER",
    "lbl_warning": "⚠️ WARNING",
    "lbl_alerts_count_singular": "Alert",
    "lbl_alerts_count_plural": "Alerts",
    "lbl_welcome_chat": "👋 <b>Kisan Mitra AI:</b> Welcome! Ask me any specific question about irrigation, rain, or market prices in your district.",
    "lbl_clear_weather": "Clear Weather",
    "lbl_rain_forecast": "⚠️ Rain Forecast ({val} mm)",
    "unit_yield": "qt / ha",
    "lbl_today": "Today",
    "lbl_normal_agronomic": "Normal agronomic conditions.",
    "footer_text": "Kisan Mitra • Zero Dummy Data Compliant • Powered by Open-Meteo, IMD, Data.gov.in & Groq AI",
    "lbl_spoken": "Spoken",
    "lbl_voice_reply": "Voice + Text Reply",
    "lbl_question": "Question",
    "lbl_answer": "Answer"
  },
  "hi": {
    "app_title": "किसान मित्र",
    "app_badge": "कृषि एवं जलवायु सुरक्षा",
    "app_subtitle": "मौसम सुरक्षा, मिट्टी की स्थिति और मंडी भाव के लिए रीयल-टाइम AI वॉयस सलाहकार।",
    "nav_dashboard": "डैशबोर्ड",
    "nav_settings": "ज़िला सेटिंग्स",
    "lbl_district": "चयनित ज़िला:",
    "lbl_crop": "चयनित फ़सल:",
    "lbl_language": "वेबसाइट की भाषा:",
    "lbl_system_status": "सिस्टम स्थिति",
    "status_connected": "कनेक्टेड",
    "status_not_connected": "डिस्कनेक्टेड",
    "btn_update": "ज़िला डेटा अपडेट करें",
    "btn_gps": "📍 वर्तमान लोकेशन उपयोग करें",
    "btn_voice_loc": "🎤 बोलकर ज़िला बताएं",
    "theme_light": "लाइट मोड",
    "theme_dark": "डार्क मोड",
    "card_weather_title": "🌦️ ताज़ा मौसम",
    "card_soil_title": "🌱 मिट्टी की नमी (जड़ क्षेत्र)",
    "card_mandi_title": "💰 APMC मंडी भाव",
    "section_alerts_title": "🚨 प्रतिकूल मौसम एवं आपदा चेतावनी",
    "section_alerts_empty": "✅ मौसम अनुकूल: वर्तमान में कोई प्रतिकूल मौसम या मिट्टी की चेतावनी नहीं है।",
    "section_yield_title": "📊 संभावित फ़सल पैदावार अनुमान",
    "lbl_baseline_yield": "मानक जैविक पैदावार",
    "lbl_estimated_yield": "वर्तमान संभावित पैदावार",
    "lbl_yield_rating": "पैदावार रेटिंग",
    "lbl_yield_progress": "क्षमता प्राप्ति प्रतिशत",
    "lbl_yield_factors": "पैदावार पर प्रभाव डालने वाले कारक",
    "lbl_humidity": "हवा में नमी",
    "lbl_rain_today": "आज की बारिश",
    "lbl_forecast_24h": "अगले 24 घंटे की बारिश",
    "lbl_topsoil": "ऊपरी मिट्टी (0-1cm)",
    "lbl_soil_temp": "सतह तापमान",
    "lbl_forecast_14d": "14 दिन की कुल बारिश",
    "lbl_soil_status": "मिट्टी की स्थिति",
    "lbl_market": "मंडी यार्ड",
    "lbl_arrival_date": "आवक दिनांक",
    "unit_price": "रुपये / क्विंटल",
    "voice_title": "🎤 वॉयस असिस्टेंट (बोलकर पूछें)",
    "voice_subtitle": "माइक दबाकर हिंदी, हिंग्लिश या अपनी भाषा में पूछें। आपको आवाज़ और टेक्स्ट दोनों में उत्तर मिलेगा।",
    "mic_idle": "बोलने के लिए माइक दबाएं",
    "mic_listening": "सुन रहा हूँ... बोलिए!",
    "mic_processing": "व्हिस्पर AI से आवाज़ पहचानी जा रही है...",
    "typing_title": "⌨️ लिखकर पूछें (केवल टेक्स्ट उत्तर)",
    "typing_subtitle": "यहाँ सवाल लिखें। AI केवल वही उत्तर देगा जो आपने पूछा है।",
    "typing_placeholder": "अपना सवाल यहाँ लिखें (जैसे: 'क्या आज {district} में पानी लगाना चाहिए?', 'गेंहू का भाव')...",
    "btn_send": "पूछें",
    "chip_irrigation": "💧 क्या आज सिंचाई करें?",
    "chip_spray": "🧪 क्या कीटनाशक छिड़कें?",
    "chip_harvest": "🌾 कटाई और बुवाई का समय?",
    "chip_price": "💵 मंडी भाव क्या है?",
    "lbl_range": "मूल्य दायरा:",
    "lbl_optimal_potential": "मानक जैविक क्षमता",
    "lbl_realized_potential": "{pct}% जैविक क्षमता प्राप्त",
    "lbl_rating_based": "वर्तमान परिस्थितियों पर आधारित",
    "lbl_crop_badge": "फ़सल: {crop}",
    "lbl_expand_factors": "विस्तार से देखें ▼",
    "lbl_action_plan": "कार्य योजना ▼",
    "lbl_step_by_step_plan": "📋 चरण-दर-चरण कार्य योजना:",
    "lbl_danger": "🚨 ख़तरा",
    "lbl_warning": "⚠️ चेतावनी",
    "lbl_alerts_count_singular": "चेतावनी",
    "lbl_alerts_count_plural": "चेतावनियाँ",
    "lbl_welcome_chat": "👋 <b>किसान मित्र AI:</b> नमस्ते! अपने ज़िले में सिंचाई, बारिश या मंडी भाव के बारे में कोई भी सवाल पूछें।",
    "lbl_clear_weather": "साफ़ मौसम",
    "lbl_rain_forecast": "⚠️ बारिश का अनुमान ({val} mm)",
    "unit_yield": "क्विंटल / हे.",
    "lbl_today": "आज",
    "lbl_normal_agronomic": "सामान्य कृषि परिस्थितियाँ।",
    "footer_text": "किसान मित्र • ज़ीरो डमी डेटा पॉलिसी प्रमाणित • ओपन-मेटिओ, डेटा.गॉव.इन एवं ग्रॉक AI द्वारा संचालित",
    "lbl_spoken": "कहा गया",
    "lbl_voice_reply": "आवाज़ + टेक्स्ट उत्तर",
    "lbl_question": "सवाल",
    "lbl_answer": "उत्तर"
  },
  "pa": {
    "app_title": "ਕਿਸਾਨ ਮਿੱਤਰ",
    "app_badge": "ਖੇਤੀਬਾੜੀ ਅਤੇ ਮੌਸਮ ਸੁਰੱਖਿਆ",
    "app_subtitle": "ਮੌਸਮ, ਜ਼ਮੀਨ ਦੀ ਨਮੀ ਅਤੇ ਮੰਡੀ ਭਾਅ ਲਈ ਰੀਅਲ-ਟਾਈਮ ਆਵਾਜ਼ੀ ਅਤੇ ਟੈਕਸਟ ਸਹਾਇਕ।",
    "nav_dashboard": "ਡੈਸ਼ਬੋਰਡ",
    "nav_settings": "ਜ਼ਿਲ੍ਹਾ ਸੈਟਿੰਗਾਂ",
    "lbl_district": "ਚੁਣਿਆ ਜ਼ਿਲ੍ਹਾ:",
    "lbl_crop": "ਚੁਣੀ ਫ਼ਸਲ:",
    "lbl_language": "ਵੈੱਬਸਾਈਟ ਦੀ ਭਾਸ਼ਾ:",
    "lbl_system_status": "ਸਿਸਟਮ ਸਥਿਤੀ",
    "status_connected": "ਕਨੈਕਟ ਕੀਤਾ",
    "status_not_connected": "ਕਨੈਕਟ ਨਹੀਂ",
    "btn_update": "ਜ਼ਿਲ੍ਹਾ ਡੇਟਾ ਤਾਜ਼ਾ ਕਰੋ",
    "btn_gps": "📍 ਮੇਰੀ ਲੋਕੇਸ਼ਨ ਵਰਤੋਂ",
    "btn_voice_loc": "🎤 ਬੋਲ ਕੇ ਜ਼ਿਲ੍ਹਾ ਦੱਸੋ",
    "theme_light": "ਲਾਈਟ ਮੋਡ",
    "theme_dark": "ਡਾਰਕ ਮੋਡ",
    "card_weather_title": "🌦️ ਤਾਜ਼ਾ ਮੌਸਮ",
    "card_soil_title": "🌱 ਜ਼ਮੀਨ ਦੀ ਨਮੀ (ਜੜ੍ਹ ਖੇਤਰ)",
    "card_mandi_title": "💰 APMC ਮੰਡੀ ਰੇਟ",
    "section_alerts_title": "🚨 ਮੌਸਮ ਅਤੇ ਕੁਦਰਤੀ ਆਫ਼ਤ ਚੇਤਾਵਨੀਆਂ",
    "section_alerts_empty": "✅ ਸਭ ਠੀਕ ਹੈ: ਕੋਈ ਖ਼ਰਾਬ ਮੌਸਮ ਜਾਂ ਜ਼ਮੀਨੀ ਚੇਤਾਵਨੀ ਨਹੀਂ ਹੈ। ਹਾਲਾਤ ਅਨੁਕੂਲ ਹਨ।",
    "section_yield_title": "📊 ਸੰਭਾਵਿਤ ਫ਼ਸਲ ਝਾੜ ਅਨੁਮਾਨ",
    "lbl_baseline_yield": "ਮਿਆਰੀ ਕੁਦਰਤੀ ਝਾੜ",
    "lbl_estimated_yield": "ਮੌਜੂਦਾ ਸੰਭਾਵਿਤ ਝਾੜ",
    "lbl_yield_rating": "ਝਾੜ ਦਰਜਾ",
    "lbl_yield_progress": "ਝਾੜ ਸਮਰੱਥਾ ਪ੍ਰਤੀਸ਼ਤ",
    "lbl_yield_factors": "ਝਾੜ 'ਤੇ ਅਸਰ ਪਾਉਣ ਵਾਲੇ ਕਾਰਕ",
    "lbl_humidity": "ਹਵਾ 'ਚ ਨਮੀ",
    "lbl_rain_today": "ਅੱਜ ਦਾ ਮੀਂਹ",
    "lbl_forecast_24h": "ਅਗਲੇ 24 ਘੰਟੇ ਮੀਂਹ",
    "lbl_topsoil": "ਉੱਪਰਲੀ ਮਿੱਟੀ (0-1cm)",
    "lbl_soil_temp": "ਜ਼ਮੀਨੀ ਤਾਪਮਾਨ",
    "lbl_forecast_14d": "14 ਦਿਨਾਂ ਦਾ ਕੁੱਲ ਮੀਂਹ",
    "lbl_soil_status": "ਜ਼ਮੀਨ ਦੀ ਹਾਲਤ",
    "lbl_market": "ਮੰਡੀ ਯਾਰਡ",
    "lbl_arrival_date": "ਆਮਦ ਮਿਤੀ",
    "unit_price": "ਰੁਪਏ / ਕੁਇੰਟਲ",
    "voice_title": "🎤 ਆਵਾਜ਼ੀ ਸਹਾਇਕ (ਬੋਲ ਕੇ ਪੁੱਛੋ)",
    "voice_subtitle": "ਮਾਈਕ ਦਬਾ ਕੇ ਪੰਜਾਬੀ ਵਿੱਚ ਪੁੱਛੋ। ਤੁਹਾਨੂੰ ਆਵਾਜ਼ ਅਤੇ ਲਿਖਤੀ ਦੋਵਾਂ 'ਚ ਜਵਾਬ ਮਿਲੇਗਾ।",
    "mic_idle": "ਬੋਲਣ ਲਈ ਮਾਈਕ ਦਬਾਓ",
    "mic_listening": "ਸੁਣ ਰਿਹਾ ਹਾਂ... ਬੋਲੋ ਜੀ!",
    "mic_processing": "ਵ੍ਹਿਸਪਰ AI ਨਾਲ ਆਵਾਜ਼ ਪਛਾਣੀ ਜਾ ਰਹੀ ਹੈ...",
    "typing_title": "⌨️ ਲਿਖ ਕੇ ਪੁੱਛੋ (ਸਿਰਫ਼ ਲਿਖਤੀ ਜਵਾਬ)",
    "typing_subtitle": "ਸਵਾਲ ਲਿਖੋ। AI ਸਿਰਫ਼ ਓਹੀ ਜਵਾਬ ਦੇਵੇਗਾ ਜੋ ਪੁੱਛਿਆ ਗਿਆ ਹੈ।",
    "typing_placeholder": "ਆਪਣਾ ਸਵਾਲ ਲਿਖੋ (ਜਿਵੇਂ: 'ਕੀ ਅੱਜ {district} ਵਿੱਚ ਪਾਣੀ ਲਾਈਏ?', 'ਕਣਕ ਦਾ ਭਾਅ')...",
    "btn_send": "ਪੁੱਛੋ",
    "chip_irrigation": "💧 ਕੀ ਅੱਜ ਪਾਣੀ ਲਾਈਏ?",
    "chip_spray": "🧪 ਕੀ ਸਪਰੇਅ ਕਰ ਸਕਦੇ ਹਾਂ?",
    "chip_harvest": "🌾 ਕਟਾਈ ਅਤੇ ਬਿਜਾਈ ਸਮਾਂ?",
    "chip_price": "💵 ਮੰਡੀ ਰੇਟ ਕੀ ਹੈ?",
    "lbl_range": "ਰੇਂਜ:",
    "lbl_optimal_potential": "ਮਿਆਰੀ ਜੈਵਿਕ ਸਮਰੱਥਾ",
    "lbl_realized_potential": "{pct}% ਜੈਵਿਕ ਸਮਰੱਥਾ ਪ੍ਰਾਪਤ",
    "lbl_rating_based": "ਮੌਜੂਦਾ ਹਾਲਾਤਾਂ 'ਤੇ ਆਧਾਰਿਤ",
    "lbl_crop_badge": "ਫ਼ਸਲ: {crop}",
    "lbl_expand_factors": "ਕਾਰਕ ਵੇਖੋ ▼",
    "lbl_action_plan": "ਕਾਰਜ ਯੋਜਨਾ ▼",
    "lbl_step_by_step_plan": "📋 ਕਦਮ-ਦਰ-ਕਦਮ ਕਾਰਜ ਯੋਜਨਾ:",
    "lbl_danger": "🚨 ਖ਼ਤਰਾ",
    "lbl_warning": "⚠️ ਚੇਤਾਵਨੀ",
    "lbl_alerts_count_singular": "ਚੇਤਾਵਨੀ",
    "lbl_alerts_count_plural": "ਚੇਤਾਵਨੀਆਂ",
    "lbl_welcome_chat": "👋 <b>ਕਿਸਾਨ ਮਿੱਤਰ AI:</b> ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ਆਪਣੇ ਜ਼ਿਲ੍ਹੇ ਵਿੱਚ ਸਿੰਚਾਈ, ਮੀਂਹ ਜਾਂ ਮੰਡੀ ਭਾਅ ਬਾਰੇ ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛੋ।",
    "lbl_clear_weather": "ਸਾਫ਼ ਮੌਸਮ",
    "lbl_rain_forecast": "⚠️ ਮੀਂਹ ਦਾ ਅਨੁਮਾਨ ({val} mm)",
    "unit_yield": "ਕੁਇੰਟਲ / ਹੈ.",
    "lbl_today": "ਅੱਜ",
    "lbl_normal_agronomic": "ਆਮ ਖੇਤੀਬਾੜੀ ਹਾਲਾਤ।",
    "footer_text": "ਕਿਸਾਨ ਮਿੱਤਰ • ਜ਼ੀਰੋ ਡਮੀ ਡੇਟਾ ਪ੍ਰਮਾਣਿਤ • ਓਪਨ-ਮੀਟੀਓ, ਡੇਟਾ.ਗੋਵ.ਇਨ ਅਤੇ ਗ੍ਰੌਕ AI ਦੁਆਰਾ ਸੰਚਾਲਿਤ",
    "lbl_spoken": "ਬੋਲਿਆ ਗਿਆ",
    "lbl_voice_reply": "ਆਵਾਜ਼ + ਲਿਖਤੀ ਜਵਾਬ",
    "lbl_question": "ਸਵਾਲ",
    "lbl_answer": "ਜਵਾਬ"
  },
  "te": {
    "app_title": "కిసాన్ మిత్ర",
    "app_badge": "వ్యవసాయ మరియు వాతావరణ రక్షణ",
    "app_subtitle": "వాతావరణ హెచ్చరికలు, నేల తేమ మరియు మార్కెట్ ధరల కోసం రియల్-టైమ్ AI సహాయకుడు.",
    "nav_dashboard": "డ్యాష్‌బోర్డ్",
    "nav_settings": "జిల్లా సెట్టింగ్‌లు",
    "lbl_district": "ఎంచుకున్న జిల్లా:",
    "lbl_crop": "ఎంచుకున్న పంట:",
    "lbl_language": "వెబ్‌సైట్ భాష:",
    "lbl_system_status": "సిస్టమ్ స్థితి",
    "status_connected": "కనెక్ట్ అయింది",
    "status_not_connected": "కనెక్ట్ కాలేదు",
    "btn_update": "జిల్లా డేటా నవీకరించండి",
    "btn_gps": "📍 నా లొకేషన్ ఉపయోగించండి",
    "btn_voice_loc": "🎤 మాట్లాడి జిల్లా చెప్పండి",
    "theme_light": "లైట్ మోడ్",
    "theme_dark": "డార్క్ మోడ్",
    "card_weather_title": "🌦️ ప్రత్యక్ష వాతావరణం",
    "card_soil_title": "🌱 నేల తేమ (వేరు మండలం)",
    "card_mandi_title": "💰 APMC మార్కెట్ ధర",
    "section_alerts_title": "🚨 ప్రతికూల వాతావరణ హెచ్చరికలు",
    "section_alerts_empty": "✅ అంతా బాగుంది: ప్రస్తుతం ఎటువంటి ప్రతికూల వాతావరణ హెచ్చరికలు లేవు.",
    "section_yield_title": "📊 పంట దిగుబడి అంచనా",
    "lbl_baseline_yield": "ప్రాథమిక జన్యు దిగుబడి",
    "lbl_estimated_yield": "ప్రస్తుత అంచనా దిగుబడి",
    "lbl_yield_rating": "దిగుబడి రేటింగ్",
    "lbl_yield_progress": "సాధించిన దిగుబడి శాతం",
    "lbl_yield_factors": "దిగుబడి ప్రభావ కారకాలు",
    "lbl_humidity": "గాలిలో తేమ",
    "lbl_rain_today": "ఈరోజు వర్షం",
    "lbl_forecast_24h": "రాబోయే 24 గంటల వర్షం",
    "lbl_topsoil": "పైనేల తేమ (0-1cm)",
    "lbl_soil_temp": "ఉపరితల ఉష్ణోగ్రత",
    "lbl_forecast_14d": "14 రోజుల మొత్తం వర్షం",
    "lbl_soil_status": "నేల స్థితి",
    "lbl_market": "మార్కెట్ యార్డ్",
    "lbl_arrival_date": "వచ్చిన తేదీ",
    "unit_price": "రూపాయలు / క్వింటాల్",
    "voice_title": "🎤 వాయిస్ అసిస్టెంట్ (మాట్లాడి అడగండి)",
    "voice_subtitle": "మైక్ నొక్కి తెలుగులో అడగండి. మీకు వాయిస్ మరియు టెక్స్ట్ రెండింటిలో సమాధానం వస్తుంది.",
    "mic_idle": "మాట్లాడటానికి మైక్ నొక్కండి",
    "mic_listening": "వింటున్నాను... మాట్లాడండి!",
    "mic_processing": "విస్పర్ AI తో వాయిస్ ప్రాసెస్ అవుతోంది...",
    "typing_title": "⌨️ టైప్ చేసి అడగండి (టెక్స్ట్ సమాధానం మాత్రమే)",
    "typing_subtitle": "మీ ప్రశ్నను టైప్ చేయండి. మీరు అడిగినదానికి మాత్రమే ఖచ్చితమైన సమాధానం వస్తుంది.",
    "typing_placeholder": "మీ ప్రశ్న ఇక్కడ టైప్ చేయండి (ఉదా: '{district} లో ఈరోజు నీరు పెట్టవచ్చా?', 'వరి ధర ఎంత?')...",
    "btn_send": "అడగండి",
    "chip_irrigation": "💧 ఈరోజు నీరు పెట్టవచ్చా?",
    "chip_spray": "🧪 మందులు పిచికారీ చేయవచ్చా?",
    "chip_harvest": "🌾 కోత మరియు విత్తన సమయం?",
    "chip_price": "💵 మార్కెట్ ధర ఎంత?",
    "lbl_range": "పరిధి:",
    "lbl_optimal_potential": "గరిష్ట జన్యు సామర్థ్యం",
    "lbl_realized_potential": "{pct}% జన్యు సామర్థ్యం సాధించబడింది",
    "lbl_rating_based": "ప్రస్తుత సమాచారం ఆధారంగా",
    "lbl_crop_badge": "పంట: {crop}",
    "lbl_expand_factors": "వివరాలు చూడండి ▼",
    "lbl_action_plan": "చర్య ప్రణాళిక ▼",
    "lbl_step_by_step_plan": "📋 దశలవారీ కార్యాచరణ ప్రణాళిక:",
    "lbl_danger": "🚨 ప్రమాదం",
    "lbl_warning": "⚠️ హెచ్చరిక",
    "lbl_alerts_count_singular": "హెచ్చరిక",
    "lbl_alerts_count_plural": "హెచ్చరికలు",
    "lbl_welcome_chat": "👋 <b>కిసాన్ మిత్ర AI:</b> నమస్కారం! మీ జిల్లాలో నీటిపారుదల, వర్షం లేదా మార్కెట్ ధరల గురించి ఏదైనా ప్రశ్న అడగండి.",
    "lbl_clear_weather": "స్వచ్ఛమైన వాతావరణం",
    "lbl_rain_forecast": "⚠️ వర్ష సూచన ({val} mm)",
    "unit_yield": "క్వింటాల్ / హెక్టారు",
    "lbl_today": "ఈరోజు",
    "lbl_normal_agronomic": "సాధారణ వ్యవసాయ పరిస్థితులు.",
    "footer_text": "కిసాన్ మిత్ర • జీరో డమ్మీ డేటా ధృవీకరించబడింది • ఓపెన్-మీటియో, డేటా.గవ్.ఇన్ మరియు గ్రోక్ AI ఆధారితం",
    "lbl_spoken": "చెప్పబడింది",
    "lbl_voice_reply": "వాయిస్ + టెక్స్ట్ సమాధానం",
    "lbl_question": "ప్రశ్న",
    "lbl_answer": "సమాధానం"
  }
};
let ALERT_TRANSLATIONS = {
  "very_heavy_rain": {
    "en": {
      "condition": "🌧️ Very Heavy Rain",
      "detail_template": "Rainfall forecast is {val} mm in the next 24 hours.",
      "advisory": "Move grain to storage immediately. Open field drains to prevent waterlogging. Stake tall crops (maize, cotton, sugarcane) against lodging."
    },
    "hi": {
      "condition": "🌧️ अत्यधिक भारी बारिश",
      "detail_template": "अगले 24 घंटों में {val} मिमी बारिश का अनुमान है।",
      "advisory": "कटी हुई फ़सल तुरंत सुरक्षित गोदाम में रखें। जलभराव रोकने के लिए जल निकासी नाले खोलें। मक्का, कपास, गन्ने जैसी लंबी फसलों को सहारा दें।"
    },
    "pa": {
      "condition": "🌧️ ਬਹੁਤ ਭਾਰੀ ਮੀਂਹ",
      "detail_template": "ਅਗਲੇ 24 ਘੰਟਿਆਂ ਵਿੱਚ {val} ਮਿਲੀਮੀਟਰ ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ ਹੈ।",
      "advisory": "ਅਨਾਜ ਤੁਰੰਤ ਸੁਰੱਖਿਅਤ ਥਾਂ 'ਤੇ ਰੱਖੋ। ਪਾਣੀ ਖੜ੍ਹਾ ਹੋਣ ਤੋਂ ਰੋਕਣ ਲਈ ਨਿਕਾਸੀ ਨਾਲੀਆਂ ਸਾਫ਼ ਕਰੋ। ਲੰਬੀਆਂ ਫ਼ਸਲਾਂ ਨੂੰ ਡਿੱਗਣ ਤੋਂ ਬਚਾਓ।"
    },
    "te": {
      "condition": "🌧️ అత్యంత భారీ వర్షం",
      "detail_template": "రాబోయే 24 గంటల్లో {val} మి.మీ వర్షపాతం అంచనా.",
      "advisory": "ధాన్యాన్ని వెంటనే సురక్షిత నిల్వ ప్రదేశానికి తరలించండి. నీరు నిల్వ ఉండకుండా కాలువలు తెరవండి. మొక్కలు పడిపోకుండా మద్దతు ఇవ్వండి."
    }
  },
  "heavy_rain": {
    "en": {
      "condition": "🌦️ Heavy Rain",
      "detail_template": "Rainfall forecast is {val} mm in the next 24 hours.",
      "advisory": "Skip irrigation. Avoid spray of pesticides and fertilizers. Clear drainage channels and cover vulnerable nurseries."
    },
    "hi": {
      "condition": "🌦️ भारी बारिश",
      "detail_template": "अगले 24 घंटों में {val} मिमी बारिश का अनुमान है।",
      "advisory": "सिंचाई तुरंत टाल दें। कीटनाशक और उर्वरक छिड़काव से बचें। जल निकासी नाले साफ़ करें और नर्सरी को ढकें।"
    },
    "pa": {
      "condition": "🌦️ ਭਾਰੀ ਮੀਂਹ",
      "detail_template": "ਅਗਲੇ 24 ਘੰਟਿਆਂ ਵਿੱਚ {val} ਮਿਲੀਮੀਟਰ ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ ਹੈ।",
      "advisory": "ਸਿੰਚਾਈ ਰੋਕ ਦਿਓ। ਕੀਟਨਾਸ਼ਕ ਅਤੇ ਖਾਦ ਦਾ ਛਿੜਕਾਅ ਨਾ ਕਰੋ। ਨਿਕਾਸੀ ਨਾਲੀਆਂ ਖੋਲ੍ਹੋ।"
    },
    "te": {
      "condition": "🌦️ భారీ వర్షం",
      "detail_template": "రాబోయే 24 గంటల్లో {val} మి.మీ వర్షపాతం అంచనా.",
      "advisory": "నీటిపారుదల ఆపండి. పురుగుమందులు, ఎరువుల పిచికారీ వద్దు. మురుగునీటి కాల్వలను శుభ్రం చేయండి."
    }
  },
  "extreme_heat": {
    "en": {
      "condition": "🥵 Extreme Heat",
      "detail_template": "Temperature is {val} °C.",
      "advisory": "Provide light irrigation. Apply organic mulching to rootzone. Avoid midday work. Apply Potassium Chloride (KCl) or anti-transpirant foliar spray to mitigate heat shock."
    },
    "hi": {
      "condition": "🥵 अत्यधिक भीषण गर्मी",
      "detail_template": "तापमान {val} °C पहुंच गया है।",
      "advisory": "शाम को हल्की सिंचाई दें। जड़ क्षेत्र में मल्चिंग (पुआल) बिछाएं। दोपहर में खेत में काम न करें। ताप तनाव कम करने के लिए पोटाश या एंटी-ट्रांसपिरेंट का छिड़काव करें।"
    },
    "pa": {
      "condition": "🥵 ਅੱਤ ਦੀ ਗਰਮੀ",
      "detail_template": "ਤਾਪਮਾਨ {val} °C ਤੱਕ ਪਹੁੰਚ ਗਿਆ ਹੈ।",
      "advisory": "ਸ਼ਾਮ ਵੇਲੇ ਹਲਕਾ ਪਾਣੀ ਲਾਓ। ਜੜ੍ਹਾਂ ਕੋਲ ਮਲਚਿੰਗ ਕਰੋ। ਦੁਪਹਿਰ ਸਮੇਂ ਕੰਮ ਨਾ ਕਰੋ। ਗਰਮੀ ਦੇ ਤਣਾਅ ਨੂੰ ਘਟਾਉਣ ਲਈ ਪੋਟਾਸ਼ ਦਾ ਛਿੜਕਾਅ ਕਰੋ।"
    },
    "te": {
      "condition": "🥵 తీవ్రమైన వేడిగాలులు",
      "detail_template": "ఉష్ణోగ్రత {val} °C కి చేరింది.",
      "advisory": "సాయంత్రం పూట తేలికపాటి నీరు పెట్టండి. వేర్ల వద్ద మల్చింగ్ వేయండి. మధ్యాహ్నం పనులు వద్దు. పొటాషియం క్లోరైడ్ లేదా రక్షణ స్ప్రే చేయండి."
    }
  },
  "high_temperature": {
    "en": {
      "condition": "☀️ High Temperature",
      "detail_template": "Temperature is {val} °C.",
      "advisory": "Increase irrigation frequency to counter high evapotranspiration. Mulch topsoil to retain moisture. Schedule all chemical spraying strictly early in the morning or late evening."
    },
    "hi": {
      "condition": "☀️ उच्च तापमान",
      "detail_template": "तापमान {val} °C है।",
      "advisory": "वाष्पीकरण की भरपाई के लिए सिंचाई का अंतर कम करें। नमी बनाए रखने के लिए मल्चिंग करें। कीटनाशक छिड़काव केवल सुबह जल्दी या देर शाम को करें।"
    },
    "pa": {
      "condition": "☀️ ਉੱਚ ਤਾਪਮਾਨ",
      "detail_template": "ਤਾਪਮਾਨ {val} °C ਹੈ।",
      "advisory": "ਨਮੀ ਬਚਾਉਣ ਲਈ ਵਾਰ-ਵਾਰ ਪਾਣੀ ਲਾਓ। ਮਿੱਟੀ 'ਤੇ ਮਲਚਿੰਗ ਕਰੋ। ਸਪਰੇਅ ਸਵੇਰੇ ਜਲਦੀ ਜਾਂ ਸ਼ਾਮ ਨੂੰ ਹੀ ਕਰੋ।"
    },
    "te": {
      "condition": "☀️ అధిక ఉష్ణోగ్రత",
      "detail_template": "ఉష్ణోగ్రత {val} °C గా ఉంది.",
      "advisory": "ఎండ తీవ్రత వల్ల నీటి తడులు పెంచండి. నేలలో తేమ ఆరిపోకుండా మల్చింగ్ చేయండి. పిచికారీ ఉదయం లేదా సాయంత్రం మాత్రమే చేయండి."
    }
  },
  "frost_severe_cold": {
    "en": {
      "condition": "❄️ Frost / Severe Cold",
      "detail_template": "Temperature is {val} °C with imminent frost risk.",
      "advisory": "Perform evening irrigation to raise soil thermal mass. Use polythene covers or straw covers on young crops. Burn smudge pots around boundaries to create an insulating smoke cover."
    },
    "hi": {
      "condition": "❄️ पाला / अत्यधिक ठंड",
      "detail_template": "तापमान {val} °C है और पाला पड़ने का भारी ख़तरा है।",
      "advisory": "मिट्टी का तापमान बनाए रखने के लिए शाम को हल्की सिंचाई करें। छोटे पौधों को पराली या प्लास्टिक से ढकें। खेत की मेड़ों पर धुंआ करें ताकि पाले का असर कम हो।"
    },
    "pa": {
      "condition": "❄️ ਕੋਰਾ / ਕਹਿਰ ਦੀ ਠੰਢ",
      "detail_template": "ਤਾਪਮਾਨ {val} °C ਹੈ ਅਤੇ ਕੋਰਾ ਪੈਣ ਦਾ ਵੱਡਾ ਖ਼ਤਰਾ ਹੈ।",
      "advisory": "ਸ਼ਾਮ ਨੂੰ ਹਲਕਾ ਪਾਣੀ ਲਾਓ ਤਾਂ ਜੋ ਜ਼ਮੀਨ ਗਰਮ ਰਹੇ। ਛੋਟੇ ਬੂਟਿਆਂ ਨੂੰ ਪਰਾਲੀ ਨਾਲ ਢਕੋ। ਖੇਤ ਦੇ ਕੰਢਿਆਂ 'ਤੇ ਧੂੰਆਂ ਕਰੋ।"
    },
    "te": {
      "condition": "❄️ విపరీతమైన చలి / మంచు ప్రభావం",
      "detail_template": "ఉష్ణోగ్రత {val} °C కి పడిపోయింది, మంచు ప్రభావం తీవ్రంగా ఉంది.",
      "advisory": "నేల చల్లబడకుండా సాయంత్రం తేలికపాటి తడి ఇవ్వండి. లేత పంటలకు గడ్డి లేదా ప్లాస్టిక్ కవర్లు వేయండి. పొలం గట్ల వద్ద పొగ పెట్టండి."
    }
  },
  "cold_wave": {
    "en": {
      "condition": "🥶 Cold Wave",
      "detail_template": "Temperature is {val} °C (Cold wave threshold).",
      "advisory": "Give evening irrigation to buffer sudden root chilling. Apply row covers on sensitive vegetable crops. Delay sowing of warm-season summer crops until temperatures recover."
    },
    "hi": {
      "condition": "🥶 शीतलहर (Cold Wave)",
      "detail_template": "तापमान {val} °C है (शीतलहर सीमा)।",
      "advisory": "जड़ों को ठंड से बचाने के लिए शाम को हल्की सिंचाई दें। संवेदनशील सब्जियों पर चादर/कवर लगाएं। तापमान सामान्य होने तक ग्रीष्मकालीन फसलों की बुवाई रोकें।"
    },
    "pa": {
      "condition": "🥶 ਸੀਤ ਲਹਿਰ",
      "detail_template": "ਤਾਪਮਾਨ {val} °C ਹੈ (ਸੀਤ ਲਹਿਰ)।",
      "advisory": "ਜੜ੍ਹਾਂ ਨੂੰ ਠੰਢ ਤੋਂ ਬਚਾਉਣ ਲਈ ਸ਼ਾਮ ਨੂੰ ਪਾਣੀ ਦਿਓ। ਸਬਜ਼ੀਆਂ ਨੂੰ ਢਕ ਕੇ ਰੱਖੋ। ਤਾਪਮਾਨ ਵਧਣ ਤੱਕ ਬਿਜਾਈ ਰੋਕੋ।"
    },
    "te": {
      "condition": "🥶 శీతల గాలులు",
      "detail_template": "ఉష్ణోగ్రత {val} °C (శీతల గాలుల స్థాయి).",
      "advisory": "వేర్లు దెబ్బతినకుండా సాయంత్రం నీరు పెట్టండి. కూరగాయల పంటలకు రక్షణ కవర్లు వాడండి. ఉష్ణోగ్రత పెరిగే వరకు కొత్త విత్తనాలు వేయకండి."
    }
  },
  "storm_wind": {
    "en": {
      "condition": "🌪️ Storm-force Wind",
      "detail_template": "Wind speed is {val} kph.",
      "advisory": "Stake crops and young trees securely. Secure poly-houses, shade nets, and temporary livestock shelters. Stay indoors during peak gusts."
    },
    "hi": {
      "condition": "🌪️ तेज़ आंधी / तूफ़ानी हवाएं",
      "detail_template": "हवा की गति {val} किमी/घंटा है।",
      "advisory": "फसलों और छोटे पेड़ों को लकड़ियों का सहारा दें। पॉलीहाउस, शेड नेट और पशु शेड को मज़बूती से बांधें। आंधी के समय सुरक्षित स्थान पर रहें।"
    },
    "pa": {
      "condition": "🌪️ ਤੇਜ਼ ਹਨੇਰੀ / ਝੱਖੜ",
      "detail_template": "ਹਵਾ ਦੀ ਰਫ਼ਤਾਰ {val} ਕਿਲੋਮੀਟਰ/ਘੰਟਾ ਹੈ।",
      "advisory": "ਫ਼ਸਲਾਂ ਅਤੇ ਬੂਟਿਆਂ ਨੂੰ ਸਹਾਰਾ ਦਿਓ। ਪੌਲੀਹਾਊਸ ਅਤੇ ਪਸ਼ੂਆਂ ਦੇ ਸ਼ੈੱਡ ਚੰਗੀ ਤਰ੍ਹਾਂ ਬੰਨ੍ਹੋ। ਹਨੇਰੀ ਵੇਲੇ ਅੰਦਰ ਰਹੋ।"
    },
    "te": {
      "condition": "🌪️ పెనుగాలులు / తుఫాను గాలులు",
      "detail_template": "గాలి వేగం {val} కి.మీ/గం.",
      "advisory": "మొక్కలకు కర్రల సాయం అందించండి. పాలీహౌస్, షేడ్ నెట్లను గట్టిగా కట్టండి. గాలుల సమయంలో సురక్షిత ప్రదేశాల్లో ఉండండి."
    }
  },
  "strong_wind": {
    "en": {
      "condition": "💨 Strong Wind",
      "detail_template": "Wind speed is {val} kph.",
      "advisory": "Postpone chemical spraying due to severe drift hazard. Reinforce crop trellises and physical nursery structures. Harvest ripe fruit and vegetables prone to premature fruit drop."
    },
    "hi": {
      "condition": "💨 तेज़ हवा",
      "detail_template": "हवा की गति {val} किमी/घंटा है।",
      "advisory": "हवा में दवा उड़ने के कारण कीटनाशक छिड़काव टाल दें। बेल वाली फसलों के मचान मज़बूत करें। पके हुए फल और सब्ज़ियां तुरंत तोड़ लें।"
    },
    "pa": {
      "condition": "💨 ਤੇਜ਼ ਹਵਾ",
      "detail_template": "ਹਵਾ ਦੀ ਰਫ਼ਤਾਰ {val} ਕਿਲੋਮੀਟਰ/ਘੰਟਾ ਹੈ।",
      "advisory": "ਸਪਰੇਅ ਉੱਡਣ ਦੇ ਖ਼ਤਰੇ ਕਾਰਨ ਛਿੜਕਾਅ ਰੋਕੋ। ਵੇਲਾਂ ਵਾਲੀਆਂ ਫ਼ਸਲਾਂ ਦੇ ਸਹਾਰੇ ਮਜ਼ਬੂਤ ਕਰੋ। ਪੱਕੀਆਂ ਸਬਜ਼ੀਆਂ ਤੋੜ ਲਵੋ।"
    },
    "te": {
      "condition": "💨 వేగవంతమైన గాలులు",
      "detail_template": "గాలి వేగం {val} కి.మీ/గం.",
      "advisory": "రసాయన పిచికారీ వెంటనే వాయిదా వేయండి. తీగ పంటల పందిళ్లను పటిష్టం చేయండి. పండిన పండ్లు, కాయలను కోయండి."
    }
  },
  "waterlogged_soil": {
    "en": {
      "condition": "🌊 Waterlogged Soil",
      "detail_template": "Soil rootzone moisture is {val} %.",
      "advisory": "Open drainage channels immediately to remove standing water. Strictly no irrigation. Watch closely for root-rot and damping-off fungal pathogens; apply recommended fungicides if required."
    },
    "hi": {
      "condition": "🌊 अत्यधिक जलभराव वाली मिट्टी",
      "detail_template": "जड़ क्षेत्र में मिट्टी की नमी {val} % पहुंच गई है।",
      "advisory": "खेत से जमा पानी निकालने के लिए तुरंत नालियां खोलें। सिंचाई पूरी तरह बंद रखें। जड़ सड़न और फफूंद रोगों पर नज़र रखें; आवश्यकतानुसार अनुशंसित कवकनाशी का छिड़काव करें।"
    },
    "pa": {
      "condition": "🌊 ਜ਼ਮੀਨ ਵਿੱਚ ਖੜ੍ਹਾ ਪਾਣੀ / ਜਲਥਲ",
      "detail_template": "ਜੜ੍ਹਾਂ ਕੋਲ ਜ਼ਮੀਨ ਦੀ ਨਮੀ {val} % ਹੋ ਗਈ ਹੈ।",
      "advisory": "ਖੜ੍ਹਾ ਪਾਣੀ ਕੱਢਣ ਲਈ ਤੁਰੰਤ ਨਾਲੀਆਂ ਖੋਲ੍ਹੋ। ਸਿੰਚਾਈ ਬਿਲਕੁਲ ਨਾ ਕਰੋ। ਜੜ੍ਹ ਗਲਣ ਦੀ ਬਿਮਾਰੀ ਤੋਂ ਬਚਾਅ ਲਈ ਉੱਲੀਨਾਸ਼ਕ ਵਰਤੋ।"
    },
    "te": {
      "condition": "🌊 నేలలో నీరు నిల్వ ఉండటం",
      "detail_template": "వేర్ల ప్రాంతంలో నేల తేమ {val} % కి చేరింది.",
      "advisory": "నిలిచిన నీటిని తీసివేయడానికి డ్రైనేజీ కాలువలు తెరవండి. నీరు పెట్టవద్దు. వేరు కుళ్లు తెగులు రాకుండా తగిన చర్యలు తీసుకోండి."
    }
  },
  "critical_drought": {
    "en": {
      "condition": "🏜️ Critical Drought",
      "detail_template": "Soil rootzone moisture is critically low at {val} %.",
      "advisory": "Deploy drip irrigation or micro-sprinklers immediately. Apply thick mulch (7-10 cm) along crop rows. Apply anti-transpirant spray to suppress leaf moisture transpiration."
    },
    "hi": {
      "condition": "🏜️ गंभीर सूखा स्थिति",
      "detail_template": "जड़ क्षेत्र में मिट्टी की नमी अत्यधिक कम होकर {val} % हो गई है।",
      "advisory": "तुरंत ड्रिप या फव्वारा सिंचाई शुरू करें। फ़सल की कतारों में 7-10 सेमी मोटी पुआल की मल्चिंग बिछाएं। पत्तियों से नमी का वाष्पीकरण रोकने के लिए एंटी-ट्रांसपिरेंट स्प्रे करें।"
    },
    "pa": {
      "condition": "🏜️ ਗੰਭੀਰ ਸੋਕਾ",
      "detail_template": "ਜੜ੍ਹ ਖੇਤਰ ਵਿੱਚ ਜ਼ਮੀਨ ਦੀ ਨਮੀ ਘਟ ਕੇ {val} % ਰਹਿ ਗਈ ਹੈ।",
      "advisory": "ਤੁਰੰਤ ਡ੍ਰਿਪ ਜਾਂ ਫੁਹਾਰਾ ਸਿੰਚਾਈ ਸ਼ੁਰੂ ਕਰੋ। ਫ਼ਸਲਾਂ ਦੇ ਵਿਚਕਾਰ ਮੋਟੀ ਮਲਚਿੰਗ ਵਿਛਾਓ। ਪੱਤਿਆਂ ਤੋਂ ਨਮੀ ਉੱਡਣ ਤੋਂ ਰੋਕਣ ਲਈ ਸਪਰੇਅ ਕਰੋ।"
    },
    "te": {
      "condition": "🏜️ తీవ్రమైన కరువు పరిస్థితి",
      "detail_template": "వేర్ల ప్రాంతంలో నేల తేమ అత్యంత తక్కువగా {val} % మాత్రమే ఉంది.",
      "advisory": "వెంటనే బిందు లేదా తుంపర సేద్యం ప్రారంభించండి. వరుసల మధ్య మల్చింగ్ వేయండి. ఆకుల నుండి తేమ ఆవిరి కాకుండా రక్షణ స్ప్రే చేయండి."
    }
  },
  "low_soil_moisture": {
    "en": {
      "condition": "🌱 Low Soil Moisture",
      "detail_template": "Soil rootzone moisture is {val} %.",
      "advisory": "Irrigate within 24 hours. Prefer morning watering to reduce evaporative loss. Avoid tillage that causes moisture loss from the topsoil."
    },
    "hi": {
      "condition": "🌱 मिट्टी में कम नमी",
      "detail_template": "जड़ क्षेत्र में मिट्टी की नमी {val} % है।",
      "advisory": "24 घंटे के भीतर सिंचाई करें। वाष्पीकरण से बचाव के लिए सुबह के समय पानी देना बेहतर है। ऊपरी मिट्टी से नमी खोने वाली गहरी जुताई से बचें।"
    },
    "pa": {
      "condition": "🌱 ਜ਼ਮੀਨ 'ਚ ਘੱਟ ਨਮੀ",
      "detail_template": "ਜੜ੍ਹਾਂ ਕੋਲ ਜ਼ਮੀਨ ਦੀ ਨਮੀ {val} % ਹੈ।",
      "advisory": "24 ਘੰਟਿਆਂ ਦੇ ਅੰਦਰ ਪਾਣੀ ਲਾਓ। ਨਮੀ ਬਚਾਉਣ ਲਈ ਸਵੇਰੇ ਪਾਣੀ ਦੇਣਾ ਚੰਗਾ ਹੈ। ਜ਼ਮੀਨ ਨੂੰ ਜ਼ਿਆਦਾ ਵਾਹੁਣ ਤੋਂ ਬਚੋ।"
    },
    "te": {
      "condition": "🌱 నేలలో తక్కువ తేమ",
      "detail_template": "వేర్ల ప్రాంతంలో నేల తేమ {val} % గా ఉంది.",
      "advisory": "24 గంటల్లోగా నీరు పెట్టండి. ఆవిరి కాకుండా ఉదయాన్నే నీరు పెట్టడం మంచిది. తేమ పోయేలా దున్నవద్దు."
    }
  }
};
let CROP_TRANSLATIONS = {
  "Wheat": {
    "en": "Wheat",
    "hi": "गेहूँ",
    "pa": "ਕਣਕ",
    "te": "గోధుమ"
  },
  "Paddy": {
    "en": "Paddy",
    "hi": "धान / चावल",
    "pa": "ਝੋਨਾ",
    "te": "వరి"
  },
  "Cotton": {
    "en": "Cotton",
    "hi": "कपास",
    "pa": "ਕਪਾਹ",
    "te": "పత్తి"
  },
  "Mustard": {
    "en": "Mustard",
    "hi": "सरसों",
    "pa": "ਸਰ੍ਹੋਂ",
    "te": "ఆవాలు"
  },
  "Potato": {
    "en": "Potato",
    "hi": "आलू",
    "pa": "ਆਲੂ",
    "te": "బంగాళాదుంప"
  },
  "Onion": {
    "en": "Onion",
    "hi": "प्याज",
    "pa": "ਪਿਆਜ਼",
    "te": "ఉల్లిపాయ"
  },
  "Maize": {
    "en": "Maize",
    "hi": "मक्का",
    "pa": "ਮੱਕੀ",
    "te": "మొక్కజొన్న"
  },
  "Sugarcane": {
    "en": "Sugarcane",
    "hi": "गन्ना",
    "pa": "ਗੰਨਾ",
    "te": "చెరకు"
  }
};
let RATING_TRANSLATIONS = {
  "excellent": {
    "en": "🟢 Excellent",
    "hi": "🟢 उत्कृष्ट",
    "pa": "🟢 ਸ਼ਾਨਦਾਰ",
    "te": "🟢 అత్యుత్తమం"
  },
  "good": {
    "en": "🟡 Good",
    "hi": "🟡 अच्छा",
    "pa": "🟡 ਵਧੀਆ",
    "te": "🟡 మంచిది"
  },
  "moderate": {
    "en": "🟠 Moderate",
    "hi": "🟠 मध्यम",
    "pa": "🟠 ਮੱਧਮ",
    "te": "🟠 మధ్యస్థం"
  },
  "poor": {
    "en": "🔴 Poor",
    "hi": "🔴 कमज़ोर",
    "pa": "🔴 ਕਮਜ਼ੋਰ",
    "te": "🔴 తక్కువ"
  },
  "critical": {
    "en": "⛔ Critical",
    "hi": "⛔ संकटपूर्ण",
    "pa": "⛔ ਨਾਜ਼ੁਕ",
    "te": "⛔ తీవ్ర ఆందోళనకరం"
  }
};
let SOIL_STATUS_TRANSLATIONS = {
  "critically_dry": {
    "en": "Critically Dry (Needs Immediate Light Irrigation)",
    "hi": "अत्यधिक सूखी (हल्की सिंचाई आवश्यक)",
    "pa": "ਬਹੁਤ ਜ਼ਿਆਦਾ ਸੁੱਕੀ (ਤੁਰੰਤ ਹਲਕੀ ਸਿੰਚਾਈ ਲੋੜੀਂਦੀ)",
    "te": "తీవ్రంగా ఎండిపోయింది (తక్షణ తేలికపాటి తడి అవసరం)"
  },
  "optimal": {
    "en": "Optimal Moisture for Plant Growth & Sowing",
    "hi": "विकास और बुवाई के लिए उत्तम नमी",
    "pa": "ਫ਼ਸਲ ਦੇ ਵਾਧੇ ਅਤੇ ਬਿਜਾਈ ਲਈ ਢੁਕਵੀਂ ਨਮੀ",
    "te": "మొక్కల పెరుగుదల మరియు విత్తడానికి సరైన తేమ"
  },
  "waterlogged": {
    "en": "Waterlogged / High Saturation (Hold Irrigation)",
    "hi": "अत्यधिक जलभराव (सिंचाई रोकें)",
    "pa": "ਜ਼ਮੀਨ ਵਿੱਚ ਖੜ੍ਹਾ ਪਾਣੀ (ਸਿੰਚਾਈ ਰੋਕੋ)",
    "te": "అధిక నీటి నిల్వ (నీటిపారుదల ఆపండి)"
  }
};
let FACTOR_TRANSLATIONS = {
  "temp_high": {
    "en": "High temperature ({temp}°C) exceeds ideal 20–30°C range, inducing heat and pollen stress (-{penalty}%)",
    "hi": "उच्च तापमान ({temp}°C) आदर्श 20–30°C सीमा से अधिक है, जिससे ताप व परागण तनाव उत्पन्न हो रहा है (-{penalty}%)",
    "pa": "ਉੱਚ ਤਾਪਮਾਨ ({temp}°C) ਆਦਰਸ਼ 20–30°C ਤੋਂ ਵੱਧ ਹੈ, ਜਿਸ ਨਾਲ ਗਰਮੀ ਦਾ ਤਣਾਅ ਪੈਦਾ ਹੁੰਦਾ ਹੈ (-{penalty}%)",
    "te": "అధిక ఉష్ణోగ్రత ({temp}°C) సాధారణ 20–30°C కంటే ఎక్కువ, వేడి ఒత్తిడిని కలిగిస్తుంది (-{penalty}%)"
  },
  "temp_low": {
    "en": "Sub-optimal temperature ({temp}°C) below 20°C slows plant metabolic and vegetative rates (-{penalty}%)",
    "hi": "कम तापमान ({temp}°C) 20°C से नीचे होने के कारण पौधों की वृद्धि और चयापचय दर धीमी हो रही है (-{penalty}%)",
    "pa": "ਘੱਟ ਤਾਪਮਾਨ ({temp}°C) 20°C ਤੋਂ ਘੱਟ ਹੋਣ ਕਰਕੇ ਬੂਟੇ ਦੇ ਵਾਧੇ ਦੀ ਰਫ਼ਤਾਰ ਮੱਠੀ ਹੈ (-{penalty}%)",
    "te": "తక్కువ ఉష్ణోగ్రత ({temp}°C) 20°C కంటే తక్కువ, మొక్కల పెరుగుదల రేటు మందగిస్తుంది (-{penalty}%)"
  },
  "temp_optimal": {
    "en": "Temperature ({temp}°C) is in the ideal 20–30°C physiological growth band (+0%)",
    "hi": "तापमान ({temp}°C) आदर्श 20–30°C वृद्धि सीमा में है (+0%)",
    "pa": "ਤਾਪਮਾਨ ({temp}°C) ਆਦਰਸ਼ 20–30°C ਵਾਧਾ ਪੱਧਰ 'ਤੇ ਹੈ (+0%)",
    "te": "ఉష్ణోగ్రత ({temp}°C) ఆదర్శవంతమైన 20–30°C పరిధిలో ఉంది (+0%)"
  },
  "moisture_deficit": {
    "en": "Rootzone moisture deficit ({moisture}%) restricts nutrient uptake and cell elongation (-{penalty}%)",
    "hi": "जड़ क्षेत्र में नमी की कमी ({moisture}%) पोषक तत्वों के अवशोषण को बाधित कर रही है (-{penalty}%)",
    "pa": "ਜੜ੍ਹ ਖੇਤਰ 'ਚ ਨਮੀ ਦੀ ਘਾਟ ({moisture}%) ਖ਼ੁਰਾਕ ਖਿੱਚਣ 'ਚ ਰੁਕਾਵਟ ਪਾਉਂਦੀ ਹੈ (-{penalty}%)",
    "te": "వేర్ల వద్ద తేమ కొరత ({moisture}%) పోషకాల శోషణను అడ్డుకుంటుంది (-{penalty}%)"
  },
  "moisture_excess": {
    "en": "Excessive rootzone moisture ({moisture}%) restricts root aeration and respiration (-{penalty}%)",
    "hi": "जड़ क्षेत्र में अत्यधिक नमी ({moisture}%) जड़ों के श्वसन और वायु प्रवाह को रोक रही है (-{penalty}%)",
    "pa": "ਜ਼ਿਆਦਾ ਨਮੀ ({moisture}%) ਜੜ੍ਹਾਂ ਦੇ ਸਾਹ ਲੈਣ ਵਿੱਚ ਰੁਕਾਵਟ ਬਣਦੀ ਹੈ (-{penalty}%)",
    "te": "వేర్ల వద్ద అధిక తేమ ({moisture}%) గాలి ప్రసరణను నిరోధిస్తుంది (-{penalty}%)"
  },
  "moisture_optimal": {
    "en": "Optimal rootzone moisture ({moisture}%) supports continuous transpiration and nutrient transport (+0%)",
    "hi": "जड़ क्षेत्र में उत्तम नमी ({moisture}%) निरंतर पोषण और स्वस्थ विकास का समर्थन करती है (+0%)",
    "pa": "ਜੜ੍ਹਾਂ ਕੋਲ ਵਧੀਆ ਨਮੀ ({moisture}%) ਨਿਰੰਤਰ ਖ਼ੁਰਾਕ ਅਤੇ ਵਾਧੇ ਵਿੱਚ ਮਦਦ ਕਰਦੀ ਹੈ (+0%)",
    "te": "తగినంత నేల తేమ ({moisture}%) నిరంతర పోషకాల సరఫరాకు మద్దతు ఇస్తుంది (+0%)"
  },
  "rain14d_dry": {
    "en": "Dry 14-day rainfall outlook ({rain_14d} mm) necessitates continuous supplemental irrigation (-8%)",
    "hi": "अगले 14 दिनों में कम बारिश ({rain_14d} मिमी) के कारण अतिरिक्त सिंचाई की आवश्यकता होगी (-8%)",
    "pa": "ਅਗਲੇ 14 ਦਿਨਾਂ 'ਚ ਘੱਟ ਮੀਂਹ ({rain_14d} ਮਿ.ਮੀ.) ਕਾਰਨ ਸਿੰਚਾਈ ਦੀ ਲੋੜ ਰਹੇਗੀ (-8%)",
    "te": "రాబోయే 14 రోజుల్లో తక్కువ వర్షం ({rain_14d} మి.మీ) కారణంగా నిరంతర నీటిపారుదల అవసరం (-8%)"
  },
  "rain14d_excess": {
    "en": "High 14-day rainfall accumulation ({rain_14d} mm) elevates saturation and root-rot risks (-15%)",
    "hi": "14 दिनों में भारी बारिश ({rain_14d} मिमी) से जलभराव और जड़ सड़न का ख़तरा बढ़ जाता है (-15%)",
    "pa": "14 ਦਿਨਾਂ 'ਚ ਭਾਰੀ ਮੀਂਹ ({rain_14d} ਮਿ.ਮੀ.) ਨਾਲ ਜੜ੍ਹ ਗਲਣ ਦਾ ਖ਼ਤਰਾ ਵਧਦਾ ਹੈ (-15%)",
    "te": "14 రోజుల్లో అధిక వర్షం ({rain_14d} మి.మీ) వల్ల వేరు కుళ్లు తెగులు ప్రమాదం ఉంది (-15%)"
  },
  "rain14d_favorable": {
    "en": "Favorable 14-day rainfall outlook ({rain_14d} mm) provides balanced natural soil moisture (+5%)",
    "hi": "14 दिनों की अनुकूल बारिश ({rain_14d} मिमी) प्राकृतिक नमी का अच्छा संतुलन प्रदान करती है (+5%)",
    "pa": "14 ਦਿਨਾਂ ਦਾ ਚੰਗਾ ਮੀਂਹ ({rain_14d} ਮਿ.ਮੀ.) ਕੁਦਰਤੀ ਨਮੀ ਦਾ ਸੰਤੁਲਨ ਬਣਾਈ ਰੱਖਦਾ ਹੈ (+5%)",
    "te": "14 రోజుల అనుకూల వర్షపాతం ({rain_14d} మి.మీ) సహజ నేల తేమను సమతుల్యం చేస్తుంది (+5%)"
  },
  "rain14d_moderate": {
    "en": "Moderate 14-day rainfall forecast ({rain_14d} mm) matches standard crop requirements (+0%)",
    "hi": "14 दिनों का सामान्य वर्षा अनुमान ({rain_14d} मिमी) फ़सल की मानक आवश्यकताओं के अनुकूल है (+0%)",
    "pa": "14 ਦਿਨਾਂ ਦਾ ਆਮ ਮੀਂਹ ({rain_14d} ਮਿ.ਮੀ.) ਫ਼ਸਲ ਦੀਆਂ ਲੋੜਾਂ ਮੁਤਾਬਕ ਹੈ (+0%)",
    "te": "14 రోజుల సాధారణ వర్ష సూచన ({rain_14d} మి.మీ) సాధారణ పంట అవసరాలకు సరిపోతుంది (+0%)"
  },
  "humidity_high": {
    "en": "Elevated relative humidity ({humidity}%) drastically elevates fungal pest and foliar blight susceptibility (-10%)",
    "hi": "हवा में अत्यधिक नमी ({humidity}%) फफूंद व कीट रोगों के ख़तरे को बहुत बढ़ा देती है (-10%)",
    "pa": "ਹਵਾ 'ਚ ਜ਼ਿਆਦਾ ਨਮੀ ({humidity}%) ਉੱਲੀ ਅਤੇ ਕੀੜਿਆਂ ਦੇ ਹਮਲੇ ਦਾ ਖ਼ਤਰਾ ਵਧਾਉਂਦੀ ਹੈ (-10%)",
    "te": "గాలిలో అధిక తేమ ({humidity}%) శిలీంధ్ర మరియు తెగుళ్ల వ్యాప్తిని పెంచుతుంది (-10%)"
  },
  "humidity_low": {
    "en": "Very dry air ({humidity}% humidity) increases crop vapor pressure deficit and water stress (-7%)",
    "hi": "अत्यधिक शुष्क हवा ({humidity}% नमी) से पौधों में वाष्पीकरण और जल तनाव बढ़ता है (-7%)",
    "pa": "ਸੁੱਕੀ ਹਵਾ ({humidity}% ਨਮੀ) ਕਰਕੇ ਫ਼ਸਲ ਵਿੱਚ ਪਾਣੀ ਦਾ ਤਣਾਅ ਵਧਦਾ ਹੈ (-7%)",
    "te": "చాలా పొడి గాలి ({humidity}% తేమ) వల్ల పంటలో నీటి ఒత్తిడి పెరుగుతుంది (-7%)"
  },
  "humidity_balanced": {
    "en": "Balanced ambient humidity ({humidity}%) ensures steady photosynthetic transpiration (+0%)",
    "hi": "संतुलित नमी ({humidity}%) प्रकाश संश्लेषण और स्थिर श्वसन बनाए रखती है (+0%)",
    "pa": "ਸੰਤੁਲਿਤ ਨਮੀ ({humidity}%) ਪੌਦਿਆਂ ਦੇ ਨਿਰੰਤਰ ਵਾਧੇ ਲਈ ਢੁਕਵੀਂ ਹੈ (+0%)",
    "te": "సమతుల్య వాతావరణ తేమ ({humidity}%) స్థిరమైన కిరణజన్య సంయోగక్రియకు సహకరిస్తుంది (+0%)"
  }
};

// Optionally fetch the latest translations from the backend
async function fetchLatestTranslations() {
  try {
    const res = await fetch("/api/translations");
    if (res.ok) {
      const liveTranslations = await res.json();
      if (liveTranslations && liveTranslations.ui) {
        UI_TRANSLATIONS = liveTranslations.ui;
        if (liveTranslations.alerts) ALERT_TRANSLATIONS = liveTranslations.alerts;
        if (liveTranslations.crops) CROP_TRANSLATIONS = liveTranslations.crops;
        if (liveTranslations.ratings) RATING_TRANSLATIONS = liveTranslations.ratings;
        if (liveTranslations.soil_statuses) SOIL_STATUS_TRANSLATIONS = liveTranslations.soil_statuses;
        if (liveTranslations.factors) FACTOR_TRANSLATIONS = liveTranslations.factors;
      } else if (liveTranslations && Object.keys(liveTranslations).length > 0) {
        UI_TRANSLATIONS = liveTranslations;
      }
      switchLanguage(currentLang);
    }
  } catch (err) {
    // Falls back seamlessly to embedded dictionaries
  }
}

function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById("themeBtn");
  const isDark = body.getAttribute("data-theme") === "dark";
  if (isDark) {
    body.removeAttribute("data-theme");
    btn.innerText = "🌙";
    localStorage.setItem("km_theme", "light");
  } else {
    body.setAttribute("data-theme", "dark");
    btn.innerText = "☀️";
    localStorage.setItem("km_theme", "dark");
  }
}

// Initialize theme from storage
(function initTheme() {
  const saved = localStorage.getItem("km_theme");
  const btn = document.getElementById("themeBtn");
  if (saved === "light") {
    document.body.removeAttribute("data-theme");
    if (btn) btn.innerText = "🌙";
  } else {
    document.body.setAttribute("data-theme", "dark");
    if (btn) btn.innerText = "☀️";
  }
})();

let sidebarDebounceTimer = null;
function toggleSidebar(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (e && e.stopPropagation) e.stopPropagation();

  // Guard against any double-firing within 120ms
  if (sidebarDebounceTimer) return;
  sidebarDebounceTimer = setTimeout(() => { sidebarDebounceTimer = null; }, 120);

  const isMobile = window.innerWidth <= 900;
  if (isMobile) {
    document.body.classList.toggle("sidebar-open");
    document.body.classList.remove("sidebar-collapsed");
  } else {
    document.body.classList.toggle("sidebar-collapsed");
    document.body.classList.remove("sidebar-open");
    const isCollapsed = document.body.classList.contains("sidebar-collapsed");
    localStorage.setItem("km_sidebar_collapsed", isCollapsed ? "true" : "false");
  }
}

function closeSidebar() {
  const isMobile = window.innerWidth <= 900;
  if (isMobile) {
    document.body.classList.remove("sidebar-open");
  } else {
    document.body.classList.add("sidebar-collapsed");
    localStorage.setItem("km_sidebar_collapsed", "true");
  }
}

function openSidebar() {
  const isMobile = window.innerWidth <= 900;
  if (isMobile) {
    document.body.classList.add("sidebar-open");
  } else {
    document.body.classList.remove("sidebar-collapsed");
    localStorage.setItem("km_sidebar_collapsed", "false");
  }
}

(function initSidebar() {
  const isMobile = window.innerWidth <= 900;
  if (!isMobile) {
    const saved = localStorage.getItem("km_sidebar_collapsed");
    if (saved === "true") {
      document.body.classList.add("sidebar-collapsed");
    }
  } else {
    document.body.classList.remove("sidebar-collapsed");
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      document.body.classList.remove("sidebar-open");
      const saved = localStorage.getItem("km_sidebar_collapsed");
      if (saved === "true") {
        document.body.classList.add("sidebar-collapsed");
      }
    } else {
      document.body.classList.remove("sidebar-collapsed");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSidebar();
    }
  });
})();

function switchLanguage(lang) {
  currentLang = lang;
  const dict = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS["en"];

  // Update all elements with data-i18n
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  // Update placeholders
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    const key = el.getAttribute("data-i18n-ph");
    if (key === "typing_placeholder") return; // Handled dynamically by updateChatPlaceholder
    if (dict[key]) {
      el.setAttribute("placeholder", dict[key]);
    }
  });

  // Update initial welcome bubble if present
  const welcomeBubble = document.getElementById("initialChatBubble");
  if (welcomeBubble && dict["lbl_welcome_chat"]) {
    welcomeBubble.innerHTML = dict["lbl_welcome_chat"];
  }

  // Dynamic re-render of telemetry cards, alerts, and yield estimator if dashboard is loaded
  if (latestDashboardData) {
    if (latestDashboardData.weather) updateWeatherCardTags(latestDashboardData.weather);
    if (latestDashboardData.soil) updateSoilCardTags(latestDashboardData.soil);
    if (latestDashboardData.alerts) renderAdverseAlerts(latestDashboardData.alerts);
    if (latestDashboardData.yield_estimate) renderYieldEstimator(latestDashboardData.yield_estimate);
  }

  updateChatPlaceholder(latestDashboardData ? latestDashboardData.district : null);
  updateSystemStatus();
  document.title = "🌾 " + (dict["app_title"] || "Kisan Mitra") + " - Agritech Assistant";
}

let currentApiStatus = {
  weather: false,
  soil: false,
  mandi: false,
  ai: false,
  server: false
};

function updateSystemStatus(statusData) {
  if (statusData) {
    currentApiStatus = { ...currentApiStatus, ...statusData };
  }

  const dict = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS["en"];
  const isConnectedText = dict["status_connected"] || "Connected";
  const isDisconnectedText = dict["status_not_connected"] || "Not Connected";

  const weatherOk = Boolean(currentApiStatus.weather);
  const soilOk = Boolean(currentApiStatus.soil);
  const mandiOk = Boolean(currentApiStatus.mandi);
  const aiOk = Boolean(currentApiStatus.ai);
  const serverOk = Boolean(currentApiStatus.server);

  const allConnected = weatherOk && soilOk && mandiOk && aiOk && serverOk;

  // 1. Overall dropdown summary badge & indicator dot
  const summaryDot = document.getElementById("statusSummaryDot");
  const summaryBadge = document.getElementById("statusSummaryBadge");
  const summaryText = document.getElementById("statusSummaryText");

  if (summaryDot && summaryBadge && summaryText) {
    if (allConnected) {
      summaryDot.className = "status-indicator-dot";
      summaryBadge.className = "status-badge-pill status-connected";
      summaryText.innerText = isConnectedText;
    } else {
      summaryDot.className = "status-indicator-dot dot-disconnected";
      summaryBadge.className = "status-badge-pill status-disconnected";
      summaryText.innerText = isDisconnectedText;
    }
  }

  // 2. Individual API pills in dropdown menu
  const updatePill = (badgeId, isOk) => {
    const el = document.getElementById(badgeId);
    if (!el) return;
    if (isOk) {
      el.className = "status-state-pill state-connected";
      el.innerText = isConnectedText;
    } else {
      el.className = "status-state-pill state-disconnected";
      el.innerText = isDisconnectedText;
    }
  };

  updatePill("badgeStatusWeather", weatherOk);
  updatePill("badgeStatusSoil", soilOk);
  updatePill("badgeStatusMandi", mandiOk);
  updatePill("badgeStatusAi", aiOk);
  updatePill("badgeStatusServer", serverOk);
}

async function checkApiHealth() {
  try {
    const res = await fetch("/api/status");
    if (res.ok) {
      const data = await res.json();
      if (data && data.services) {
        updateSystemStatus({
          weather: Boolean(data.services.weather && data.services.weather.connected),
          soil: Boolean(data.services.soil && data.services.soil.connected),
          mandi: Boolean(data.services.mandi && data.services.mandi.connected),
          ai: Boolean(data.services.ai && data.services.ai.connected),
          server: Boolean(data.services.server && data.services.server.connected)
        });
      }
    }
  } catch (err) {
    updateSystemStatus({
      weather: false,
      soil: false,
      mandi: false,
      ai: false,
      server: false
    });
  }
}

function updateChatPlaceholder(customDistrict = null) {
  const districtInput = document.getElementById("districtInput");
  const district = (customDistrict || (districtInput ? districtInput.value.trim() : "") || "Ludhiana");
  const inputEl = document.getElementById("queryTextInput");
  if (!inputEl) return;

  const dict = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS["en"];
  let rawPh = dict["typing_placeholder"] || "Ask a question (e.g. 'Should I irrigate today in {district}?', 'Mandi price of wheat')...";
  
  let formatted = rawPh.includes("{district}")
    ? rawPh.replace(/\{district\}/g, district)
    : rawPh.replace(/Ludhiana/gi, district);

  inputEl.setAttribute("placeholder", formatted);
}

function updateWeatherCardTags(w) {
  if (!w) return;
  const dict = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS["en"];
  const rainAlert = document.getElementById("tagRainAlert");
  if (!rainAlert) return;

  if (w.next_24h_rainfall_forecast_mm > 5) {
    rainAlert.className = "stat-tag tag-amber";
    const pattern = dict["lbl_rain_forecast"] || "⚠️ Rain Forecast ({val} mm)";
    rainAlert.innerText = pattern.replace("{val}", w.next_24h_rainfall_forecast_mm);
  } else {
    rainAlert.className = "stat-tag tag-blue";
    rainAlert.innerText = dict["lbl_clear_weather"] || "Clear Weather";
  }
}

function updateSoilCardTags(s) {
  if (!s) return;
  const soilTag = document.getElementById("tagSoilStatus");
  if (!soilTag) return;

  const statusId = s.soil_status_id || (s.rootzone_moisture_pct < 18 ? "critically_dry" : s.rootzone_moisture_pct > 60 ? "waterlogged" : "optimal");
  const soilStatusLocalized = (SOIL_STATUS_TRANSLATIONS[statusId] && SOIL_STATUS_TRANSLATIONS[statusId][currentLang])
    || s.soil_status
    || "Adequate Moisture";

  soilTag.innerText = soilStatusLocalized;
  if (s.rootzone_moisture_pct < 18) {
    soilTag.className = "stat-tag tag-amber";
  } else {
    soilTag.className = "stat-tag tag-emerald";
  }
}

async function loadDashboard() {
  const district = document.getElementById("districtInput").value.trim() || "Ludhiana";
  const crop = document.getElementById("cropSelect").value;
  
  try {
    const res = await fetch(`/api/district?name=${encodeURIComponent(district)}&crop=${encodeURIComponent(crop)}`);
    if (!res.ok) {
      updateSystemStatus({ weather: false, soil: false, mandi: false, ai: false, server: false });
      return;
    }
    const data = await res.json();
    if (data.error) {
      updateSystemStatus({ weather: false, soil: false, mandi: false, ai: true, server: true });
      alert("Error: " + data.error);
      return;
    }

    // Cache the complete data payload for instant multilingual switching
    latestDashboardData = data;

    // Dynamic Connection status based on whether API can fetch info
    const weatherFetched = Boolean(data.weather && data.weather.temperature_c !== null && data.weather.temperature_c !== undefined);
    const soilFetched = Boolean(data.soil && data.soil.rootzone_moisture_pct !== null && data.soil.rootzone_moisture_pct !== undefined);
    const mandiFetched = Boolean(data.mandi && !data.mandi.error && (data.mandi.modal_price !== null && data.mandi.modal_price !== undefined));
    const aiFetched = Boolean(data.api_status ? data.api_status.services.ai.connected : true);

    updateSystemStatus({
      weather: weatherFetched,
      soil: soilFetched,
      mandi: mandiFetched,
      ai: aiFetched,
      server: true
    });

    // Weather Card
    const w = data.weather;
    document.getElementById("statTemp").innerText = `${w.temperature_c}°C`;
    document.getElementById("statHumidity").innerText = `${w.humidity_pct}%`;
    document.getElementById("statRainToday").innerText = `${w.precipitation_now_mm} mm`;
    document.getElementById("statRain24h").innerText = `${w.next_24h_rainfall_forecast_mm} mm`;
    updateWeatherCardTags(w);

    // Soil Card
    const s = data.soil;
    document.getElementById("statSoilMoisture").innerText = `${s.rootzone_moisture_pct}%`;
    document.getElementById("statTopsoil").innerText = `${s.topsoil_moisture_pct}%`;
    document.getElementById("statSoilTemp").innerText = `${s.soil_temp_surface_c}°C`;
    document.getElementById("statRain14d").innerText = `${s.forecast_14d_rainfall_mm} mm`;
    updateSoilCardTags(s);

    // Mandi Card
    const m = data.mandi;
    const dict = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS["en"];
    document.getElementById("statMandiPrice").innerText = m.modal_price ? `₹ ${m.modal_price}` : "₹ N/A";
    document.getElementById("statMandiYard").innerText = m.market || `${data.district} APMC`;
    document.getElementById("statPriceRange").innerText = `₹ ${m.min_price || '--'} - ₹ ${m.max_price || '--'}`;
    document.getElementById("statArrivalDate").innerText = m.arrival_date || (dict["lbl_today"] || "Today");

    // District badge & placeholder update
    document.getElementById("headerDistrictBadge").innerText = `• ${data.district}`;
    document.getElementById("activeDistrictDisplay").innerText = `${data.district}, ${data.state}`;
    updateChatPlaceholder(data.district);

    // 1. Render Adverse Alerts
    renderAdverseAlerts(data.alerts);

    // 2. Render Crop Yield Estimator
    renderYieldEstimator(data.yield_estimate);

    if (window.innerWidth <= 900) {
      closeSidebar();
    }
  } catch(e) {
    console.error("Dashboard error:", e);
    updateSystemStatus({ weather: false, soil: false, mandi: false, ai: false, server: false });
  }
}

function renderAdverseAlerts(alerts) {
  const container = document.getElementById("alertsContainer");
  const countBadge = document.getElementById("alertsCountBadge");
  const dict = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS["en"];

  if (!alerts || alerts.length === 0) {
    const alertWord = dict["lbl_alerts_count_plural"] || "Alerts";
    countBadge.innerText = `0 ${alertWord}`;
    countBadge.style.color = "var(--accent-emerald)";
    countBadge.style.borderColor = "var(--accent-emerald)";
    container.innerHTML = `
      <div class="alert-empty-card">
        ${dict["section_alerts_empty"] || "✅ All Clear: No adverse weather or soil alerts currently detected. Conditions are favorable."}
      </div>
    `;
    return;
  }

  const alertWord = alerts.length === 1 
    ? (dict["lbl_alerts_count_singular"] || "Alert")
    : (dict["lbl_alerts_count_plural"] || "Alerts");
  countBadge.innerText = `${alerts.length} ${alertWord}`;
  countBadge.style.color = "var(--accent-rose)";
  countBadge.style.borderColor = "rgba(239, 68, 68, 0.4)";

  let html = "";
  alerts.forEach((alert, idx) => {
    const isDanger = alert.severity === "danger";
    const tagClass = isDanger ? "danger" : "warning";
    const tagLabel = isDanger 
      ? (dict["lbl_danger"] || "🚨 DANGER")
      : (dict["lbl_warning"] || "⚠️ WARNING");

    // Retrieve localized alert texts from ALERT_TRANSLATIONS
    const condId = alert.condition_id;
    const alertDict = (ALERT_TRANSLATIONS[condId] && ALERT_TRANSLATIONS[condId][currentLang])
      || (ALERT_TRANSLATIONS[condId] && ALERT_TRANSLATIONS[condId]["en"])
      || null;

    const conditionTitle = alertDict ? alertDict.condition : alert.condition;
    const detailText = alertDict 
      ? alertDict.detail_template.replace("{val}", alert.val !== undefined ? alert.val : "")
      : alert.detail;
    const advisoryText = alertDict ? alertDict.advisory : alert.advisory;

    const actionPlanLabel = dict["lbl_action_plan"] || "Action Plan ▼";
    const stepByStepLabel = dict["lbl_step_by_step_plan"] || "📋 Step-by-Step Action Plan:";

    html += `
      <details class="alert-item ${tagClass}" ${idx === 0 ? 'open' : ''}>
        <summary class="alert-summary">
          <div class="alert-title-box">
            <span class="alert-tag ${tagClass}">${tagLabel}</span>
            <span class="alert-condition">${conditionTitle}</span>
            <span class="alert-detail-inline">• ${detailText}</span>
          </div>
          <span style="font-size:0.8rem; color:var(--text-muted); font-weight:600;">${actionPlanLabel}</span>
        </summary>
        <div class="alert-body">
          <div class="advisory-box">
            <b>${stepByStepLabel}</b><br>${advisoryText}
          </div>
        </div>
      </details>
    `;
  });

  container.innerHTML = html;
}

function renderYieldEstimator(ye) {
  if (!ye || !ye.crop) return;
  const dict = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS["en"];

  // Localized crop badge
  const cropKey = Object.keys(CROP_TRANSLATIONS).find(k => k.toLowerCase() === ye.crop.toLowerCase()) || ye.crop;
  const cropLocalized = (CROP_TRANSLATIONS[cropKey] && CROP_TRANSLATIONS[cropKey][currentLang]) || ye.crop;
  const cropBadgePattern = dict["lbl_crop_badge"] || "Crop: {crop}";
  document.getElementById("yieldCropBadge").innerText = cropBadgePattern.replace("{crop}", cropLocalized);

  // Localized yield units
  const yieldUnit = dict["unit_yield"] || "qt / ha";
  document.getElementById("statBaselineYield").innerText = `${ye.baseline_yield_q_ha} ${yieldUnit}`;
  document.getElementById("statEstimatedYield").innerText = `${ye.estimated_yield_q_ha} ${yieldUnit}`;

  // Localized rating
  let ratingId = ye.rating_id;
  if (!ratingId && ye.rating) {
    const rLower = ye.rating.toLowerCase();
    if (rLower.includes("excellent")) ratingId = "excellent";
    else if (rLower.includes("good")) ratingId = "good";
    else if (rLower.includes("moderate")) ratingId = "moderate";
    else if (rLower.includes("poor")) ratingId = "poor";
    else if (rLower.includes("critical")) ratingId = "critical";
  }
  const ratingLocalized = (RATING_TRANSLATIONS[ratingId] && RATING_TRANSLATIONS[ratingId][currentLang]) || ye.rating;
  document.getElementById("statYieldRating").innerText = ratingLocalized;

  const pct = ye.yield_factor_pct || 0;
  const deltaPattern = dict["lbl_realized_potential"] || "{pct}% of genetic potential";
  document.getElementById("statYieldDelta").innerText = deltaPattern.replace("{pct}", pct);
  document.getElementById("progressPctText").innerText = `${pct}% (${ratingLocalized})`;

  const bar = document.getElementById("yieldProgressBar");
  bar.style.width = `${pct}%`;
  if (pct >= 85) {
    bar.style.background = "linear-gradient(90deg, #10B981, #059669)";
  } else if (pct >= 65) {
    bar.style.background = "linear-gradient(90deg, #F59E0B, #D97706)";
  } else {
    bar.style.background = "linear-gradient(90deg, #EF4444, #DC2626)";
  }

  // Factor breakdown list localization
  const factorsList = document.getElementById("yieldFactorsList");
  if (ye.factors_detailed && ye.factors_detailed.length > 0) {
    factorsList.innerHTML = ye.factors_detailed.map(item => {
      let icon = "🔹";
      if (item.delta && item.delta.includes("+0%")) icon = "🟢";
      else if (item.delta && item.delta.includes("+")) icon = "✨";
      else if (item.delta && item.delta.includes("-")) icon = "⚠️";

      const fDict = (FACTOR_TRANSLATIONS[item.code] && FACTOR_TRANSLATIONS[item.code][currentLang])
        || (FACTOR_TRANSLATIONS[item.code] && FACTOR_TRANSLATIONS[item.code]["en"]);
      let factorText = item.desc;
      if (fDict) {
        factorText = fDict
          .replace("{temp}", item.temp !== undefined ? item.temp : "")
          .replace("{moisture}", item.moisture !== undefined ? item.moisture : "")
          .replace("{rain_14d}", item.rain_14d !== undefined ? item.rain_14d : "")
          .replace("{humidity}", item.humidity !== undefined ? item.humidity : "")
          .replace("{penalty}", item.penalty !== undefined ? item.penalty : "");
      }
      return `<div class="factor-item"><span class="factor-bullet">${icon}</span> <span>${factorText}</span></div>`;
    }).join("");
  } else if (ye.factors && ye.factors.length > 0) {
    factorsList.innerHTML = ye.factors.map(f => {
      let icon = "🔹";
      if (f.includes("(+0%)")) icon = "🟢";
      else if (f.includes("(+5%)")) icon = "✨";
      else if (f.includes("(-")) icon = "⚠️";
      return `<div class="factor-item"><span class="factor-bullet">${icon}</span> <span>${f}</span></div>`;
    }).join("");
  } else {
    factorsList.innerHTML = `<div class="factor-item">${dict["lbl_normal_agronomic"] || "Normal agronomic conditions."}</div>`;
  }
}

// -------------------------------------------------------------
// GPS Location via Device Browser
// -------------------------------------------------------------
function useDeviceGpsLocation() {
  const btn = document.getElementById("btnGps");
  btn.innerText = "⏳ Detecting GPS...";

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    btn.innerText = UI_TRANSLATIONS[currentLang]["btn_gps"] || "📍 Use Device GPS";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      try {
        const res = await fetch("/api/location/gps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lon })
        });
        const data = await res.json();
        if (data.district) {
          document.getElementById("districtInput").value = data.district;
          loadDashboard();
        }
      } catch (e) {
        console.error(e);
      } finally {
        btn.innerText = UI_TRANSLATIONS[currentLang]["btn_gps"] || "📍 Use Device GPS";
      }
    },
    (err) => {
      alert("Unable to retrieve location: " + err.message);
      btn.innerText = UI_TRANSLATIONS[currentLang]["btn_gps"] || "📍 Use Device GPS";
    },
    { timeout: 10000 }
  );
}

// -------------------------------------------------------------
// Speak District Name via Voice
// -------------------------------------------------------------
async function speakDistrictLocation() {
  const btn = document.getElementById("btnVoiceLoc");
  btn.innerText = "🎙️ Speak District...";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = async () => {
      const audioBlob = new Blob(chunks, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("lang", currentLang);

      btn.innerText = "⏳ Recognizing...";
      try {
        const res = await fetch("/api/location/voice", {
          method: "POST",
          body: formData
        });
        const d = await res.json();
        if (d.district) {
          document.getElementById("districtInput").value = d.district;
          loadDashboard();
        }
      } catch (err) {
        console.error(err);
      } finally {
        btn.innerText = UI_TRANSLATIONS[currentLang]["btn_voice_loc"] || "🎤 Speak District";
      }
    };

    recorder.start();
    setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, 3800);
  } catch (err) {
    alert("Microphone access error: " + err.message);
    btn.innerText = UI_TRANSLATIONS[currentLang]["btn_voice_loc"] || "🎤 Speak District";
  }
}

// -------------------------------------------------------------
// Voice Assistant Recording -> Voice + Text Reply
// -------------------------------------------------------------
async function toggleVoiceRecording() {
  const micBtn = document.getElementById("micBtn");
  const micStatus = document.getElementById("micStatus");
  const dict = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS["en"];

  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);

      mediaRecorder.onstop = async () => {
        micStatus.innerText = dict["mic_processing"] || "Transcribing with Whisper Large v3...";
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        await sendVoiceQuery(audioBlob);
      };

      mediaRecorder.start();
      isRecording = true;
      micBtn.classList.add("active");
      micStatus.innerText = dict["mic_listening"] || "Listening... Speak now!";
      
      // Auto-stop safety timer at 6 seconds
      setTimeout(() => {
        if (isRecording) toggleVoiceRecording();
      }, 6000);
    } catch(err) {
      alert("Microphone permission denied: " + err.message);
    }
  } else {
    isRecording = false;
    micBtn.classList.remove("active");
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
  }
}

async function sendVoiceQuery(blob) {
  const district = document.getElementById("districtInput").value;
  const crop = document.getElementById("cropSelect").value;
  const chatWindow = document.getElementById("chatWindow");
  const dict = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS["en"];

  const formData = new FormData();
  formData.append("audio", blob);
  formData.append("district", district);
  formData.append("crop", crop);
  formData.append("lang", currentLang);

  try {
    const res = await fetch("/api/voice", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    
    // Check if district changed
    if (data.district && data.district !== district) {
      document.getElementById("districtInput").value = data.district;
      loadDashboard();
    }

    const spokenLabel = dict["lbl_spoken"] || "Spoken";
    const voiceReplyLabel = dict["lbl_voice_reply"] || "Voice + Text Reply";

    chatWindow.innerHTML += `<div class="chat-bubble bubble-user">🎙️ <b>${spokenLabel}:</b> "${data.transcript}"</div>`;
    chatWindow.innerHTML += `<div class="chat-bubble bubble-bot-voice">🔊 <b>${voiceReplyLabel}:</b> ${data.answer}</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Play base64 audio natively in browser
    if (data.audio_base64) {
      const player = document.getElementById("audioPlayer");
      player.src = "data:audio/mp3;base64," + data.audio_base64;
      player.play().catch(e => console.log("Audio play error:", e));
    }
  } catch(e) {
    chatWindow.innerHTML += `<div class="chat-bubble bubble-bot-text">❌ Error processing voice query.</div>`;
  } finally {
    document.getElementById("micStatus").innerText = dict["voice_subtitle"] || "Click mic to speak.";
  }
}

// -------------------------------------------------------------
// Text Query -> Text-Only Reply
// -------------------------------------------------------------
async function sendTextQuery() {
  const input = document.getElementById("queryTextInput");
  const q = input.value.trim();
  if (!q) return;

  input.value = "";
  const district = document.getElementById("districtInput").value;
  const crop = document.getElementById("cropSelect").value;
  const chatWindow = document.getElementById("chatWindow");
  const dict = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS["en"];

  const questionLabel = dict["lbl_question"] || "Question";
  const answerLabel = dict["lbl_answer"] || "Answer";

  chatWindow.innerHTML += `<div class="chat-bubble bubble-user">📝 <b>${questionLabel}:</b> ${q}</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ district, crop, question: q, lang: currentLang })
    });
    const data = await res.json();

    chatWindow.innerHTML += `<div class="chat-bubble bubble-bot-text">📄 <b>${answerLabel}:</b> ${data.answer}</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch(e) {
    chatWindow.innerHTML += `<div class="chat-bubble bubble-bot-text">❌ Error getting answer.</div>`;
  }
}

function askQuickChip(type) {
  const dict = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS["en"];
  let q = "";
  if (type === "irrigation") q = dict["chip_irrigation"] || "Should I irrigate today?";
  else if (type === "spray") q = dict["chip_spray"] || "Safe to spray pesticide?";
  else if (type === "harvest") q = dict["chip_harvest"] || "Sowing and harvest window?";
  else if (type === "price") q = dict["chip_price"] || "What is the Mandi price?";
  
  document.getElementById("queryTextInput").value = q;
  sendTextQuery();
}

window.onload = () => {
  fetchLatestTranslations();
  checkApiHealth();
  loadDashboard();
  updateChatPlaceholder();

  // Instant placeholder update as the user types or alters target district
  const distInput = document.getElementById("districtInput");
  if (distInput) {
    distInput.addEventListener("input", () => updateChatPlaceholder());
    distInput.addEventListener("change", () => updateChatPlaceholder());
  }
};