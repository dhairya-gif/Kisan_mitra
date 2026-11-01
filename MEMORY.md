# 🌾 Project Memory: Kisan Mitra (Multilingual Agritech & Resource Advisory Assistant)

> **Track:** Climate, Resource Infrastructure & Global Supply Resilience  
> **Theme:** Multilingual Agritech & Resource Advisory Assistant  
> **Status:** Active, Production-Ready, Modular Frontend Decoupled & Live  
> **Last Updated:** 2026-11-01 11:50 IST  

---

## 1. Executive Summary & Track Context
This system addresses systemic operational and environmental challenges in agriculture—including extreme weather shifts (heatwaves, flash floods, frost, drought trends), yield instability, resource over-depletion (groundwater), and APMC market price opacity.

**Kisan Mitra (किसान मित्र)** is an intelligent, high-speed conversational and voice assistant built for Indian farmers. It ingests:
1. **Live Weather Forecasts** (14-day forward rainfall lookahead and hourly atmospheric parameters from Open-Meteo ECMWF)
2. **Local Multi-Depth Soil Metrics** (4 strata: 0–1 cm topsoil, 1–3 cm, 3–9 cm rootzone, 9–27 cm deep, plus surface temperature from ECMWF Land Model)
3. **Official APMC Mandi Prices** (Live Agmarknet / eNAM price streams from Data.gov.in resource `9ef84268-d588-465a-a308-a864a43d0070`)
4. **🚨 Autonomous Adverse-Weather Advisories (`detect_adverse_weather`)**: Structured agronomic action plans for 11 critical conditions (Extreme Heat, Frost, Waterlogging, Drought, Storm Wind, etc.)
5. **📊 Dynamic Crop Yield Estimator (`estimate_crop_yield`)**: Genetic baseline modeling with physiological penalties for temperature, rootzone moisture, 14-day rain, and humidity extremes.
6. **Multilingual Voice STT & TTS** (Groq Whisper-large-v3 tuned with Indian agricultural vocabulary & native audio speech streaming)
7. **Precision Groq LLM Advisory Engine** (`qwen/qwen3.8-27b`) trained/prompted to answer **strictly what was asked** and match language style (Hinglish, pure Hindi, Punjabi, Telugu, English).

---

## 2. Key Modules Added in Latest Iteration

### 1. 🚨 Autonomous Adverse-Weather Advisory (`detect_adverse_weather`)
* Returns a list of structured alert objects:
  ```python
  {
      "severity": "danger" | "warning",
      "condition": "🥵 Extreme Heat",
      "detail": "Temperature is 44 °C.",
      "advisory": "Full action plan (what to do next)..."
  }
  ```
* **Covered Conditions & Thresholds:**
  1. *Very Heavy Rain* (`> 50 mm/24 h`, Danger): Move grain to storage, open drains, stake tall crops.
  2. *Heavy Rain* (`> 20 mm/24 h`, Warning): Skip irrigation, avoid spray, clear drainage, cover nurseries.
  3. *Extreme Heat* (`> 42 °C`, Danger): Light irrigation, mulching, avoid midday work, KCl foliar spray.
  4. *High Temperature* (`> 35 °C`, Warning): Increase irrigation frequency, mulch, schedule spraying early/late.
  5. *Frost / Severe Cold* (`< 2 °C`, Danger): Evening irrigation, polythene covers, smudge pots.
  6. *Cold Wave* (`< 5 °C`, Warning): Evening irrigation, row covers, delay summer sowing.
  7. *Storm-force Wind* (`> 40 kph`, Danger): Stake crops, secure poly-houses, stay indoors.
  8. *Strong Wind* (`> 25 kph`, Warning): Postpone spraying, reinforce structures, harvest ripe fruit.
  9. *Critical Drought* (`Moisture < 10 %`, Danger): Drip irrigation, thick mulch, anti-transpirant spray.
  10. *Low Soil Moisture* (`Moisture < 18 %`, Warning): Irrigate within 24 h, morning watering, avoid tillage.
  11. *Waterlogged Soil* (`Moisture > 80 %`, Danger): Open drainage, no irrigation, watch for root-rot.
* **UI Presentation:** Positioned immediately between the telemetry cards and the interactive AI assistant. Renders expandable panels with condition tags, severity markers, and a blue/indigo action plan advisory box. When no alerts are present, displays an "All Clear" green card.

---

### 2. 📊 Dynamic Crop Yield Estimator (`estimate_crop_yield`)
* **Genetic Baseline Yields:**
  - Wheat: 50.0 qt/ha | Potato: 250.0 qt/ha | Onion: 200.0 qt/ha | Paddy: 45.0 qt/ha
  - Maize: 55.0 qt/ha | Cotton: 25.0 qt/ha | Mustard: 20.0 qt/ha | Chilli: 30.0 qt/ha
* **Penalties & Multipliers:**
  - *Temperature:* Deviations outside the ideal 20–30 °C band induce heat/chill penalties.
  - *Soil Moisture:* Deficits (< 25%) or saturation (> 60%) penalize nutrient uptake/aeration.
  - *14-Day Rain Outlook:* Penalties for < 5 mm drought or > 120 mm excess; bonus (+5%) for balanced 15–80 mm.
  - *Humidity:* High humidity (> 85%) incurs fungal pathogen penalty; dry air (< 30%) incurs transpiration stress.
* **Ratings:** `🟢 Excellent` (≥90%), `🟡 Good` (75–89%), `🟠 Moderate` (55–74%), `🔴 Poor` (35–54%), `⛔ Critical` (<35%).
* **UI Presentation:**
  - Three metric cards: Baseline Genetic Yield, Estimated Current Yield, Yield Rating.
  - Smooth progress bar showing genetic potential realized (color-coded by rating).
  - Expandable factor breakdown listing every environmental factor with impact percentages.

---

### 3. 🎨 Modular Web App Decoupling
* **Decoupled Frontend:**
  - `index.html`: Decoupled semantic HTML5 layout with sidebar controls, telemetry cards, advisories, yield estimator, and interactive voice/chat.
  - `style.css`: 21st.dev inspired glassmorphic stylesheet, light/dark themes, and CSS animations.
  - `app.js`: High-performance client controller handling multilingual UI dictionary switching, browser GPS, mic STT streaming, TTS audio playback, and dynamic DOM telemetry updates.
* **Streamlined Server (`server.py`):**
  - Reduced by >1,500 lines by removing raw embedded template strings.
  - Serves static files with automatic MIME detection (`text/html`, `text/css`, `application/javascript`, images, audio) via `_serve_file()`.
  - Frontend edits now reflect instantly on browser refresh without server restarts.

---

## 3. Project Architecture & Endpoints

```text
C:\agritech_assistant\
├── .env              # Environment secrets, model choices & server settings
├── .env.example      # Example environment template for deployment
├── server.py         # Multithreaded server and API route controller
├── index.html        # Clean decoupled HTML5 frontend structure
├── style.css         # 21st.dev glassmorphic design system & dark mode CSS
├── app.js            # Client-side JavaScript (telemetry, STT/TTS, geolocation, alerts)
├── data_fetcher.py   # Live Open-Meteo, ECMWF Soil, Agmarknet, Adverse Weather, Yield Estimator
├── ai_engine.py      # Precision LLM reasoning engine (Qwen 3.8-27B) & Hinglish matcher
├── stt_tts.py        # Groq Whisper-large-v3 Indic STT & base64 TTS audio streamer
├── config.py         # Zero-dependency .env loader, crop aliases, UI translation dictionaries
├── run.bat           # 1-Click launcher with LAN IP printer for phone sharing
├── share.bat         # 1-Click launcher for Cloudflare public HTTPS internet tunnel
├── cloudflared.exe   # Standalone Cloudflare Tunnel client
├── cache.db          # SQLite 60-min TTL cache preventing API rate limits
├── MEMORY.md         # Local repository documentation & system memory
└── README.md         # Complete user guide, sharing manual, and deployment steps
```

---

## 4. Agent Working Memory Protocol
* **Single Source of Truth:** `MEMORY.md` serves as the persistent memory and operational journal.
* **Workflow Rule:** Review `MEMORY.md` prior to beginning tasks and keep it updated after major changes, feature additions, or architectural refactorings.
* **Configuration Management:** All API keys and model hyperparameters are shifted to `.env` with safe fallbacks and zero external dependencies.
* **UI Polish & Verification (2026-11-01 12:35 IST):** 
  - Restructured into an uncluttered layout with a balanced 2-column `.intelligence-grid` (Advisories + Crop Yield Estimator side-by-side).
  - Implemented custom global glassmorphic scrollbars across the whole site.
  - Added cubic-bezier theme transitions ensuring identical structure and smooth, flicker-free contrast shifting between Light and Dark modes.
  - **Dynamic Ask AI Placeholder**: Linked `#queryTextInput` placeholder directly to `#districtInput` via `input` and `change` event listeners and `updateChatPlaceholder()`. As the farmer modifies the target district (e.g. typing, GPS location, voice input, or language toggle), the placeholder dynamically reflects the selected district across all 4 supported languages (English, Hindi, Punjabi, Telugu).
  - Fully validated via browser subagent across language switching and live district modification.
* **System Status Dropdown Menu (2026-11-01 13:50 IST):**
  - Converted the static System Status card in the left sidebar into an interactive, sleek dropdown menu (`#statusDropdown`).
  - Summarizes connection status on the trigger bar: `🟢 Connected` or `🔴 Not Connected` with a live indicator dot and chevron.
  - When expanded, shows real-time connectivity for each of the 5 core services based on actual API fetch ability:
    1. 📡 **Weather API**: Open-Meteo ECMWF (`🟢 Connected` / `🔴 Not Connected`)
    2. 🌱 **Soil Health API**: ECMWF Land 4-layer model (`🟢 Connected` / `🔴 Not Connected`)
    3. 💰 **Mandi Price API**: Agmarknet / Data.gov.in (`🟢 Connected` / `🔴 Not Connected`)
    4. 🧠 **Groq AI Service**: Whisper-v3 STT & Qwen LLM (`🟢 Connected` / `🔴 Not Connected`)
    5. ⚡ **API Gateway**: Local Python daemon endpoint `/api/status` & `/api/district` (`🟢 Connected` / `🔴 Not Connected`)
  - Added full multilingual localization for English (`Connected`), Hindi (`कनेक्टेड`), Punjabi (`ਕਨੈਕਟ ਕੀਤਾ`), and Telugu (`కనెక్ట్ అయింది`).
  - Added dedicated backend endpoint `GET /api/status` returning real-time service health dictionary.
  - Verified and recorded in integrated browser (`status_dropdown_validation_1793521414385.webp`).
* **Mobile Responsiveness & Collapsible Sidemenu (2026-11-01 14:35 IST):**
  - **Collapsible Sidebar on Desktop**: Added `#sidebarToggleBtn` (`☰ District Settings`) in the top navigation bar. Clicking smoothly collapses or expands the sidebar (`body.sidebar-collapsed`), giving farmers maximal screen real estate for telemetry, advisories, and charts.
  - **Off-Canvas Slide Drawer on Mobile & Tablet**:
    - Under `@media (max-width: 900px)` and `@media (max-width: 640px)`, the sidebar transforms into an off-canvas slide-out drawer (`transform: translateX(-100%)` to `translateX(0)`).
    - Added high-performance frosted backdrop (`#sidebarBackdrop`) that blurs background content when the drawer is open.
    - Integrated multi-touch dismissal: farmers can close the drawer via the close button (`✕`), tapping anywhere on the backdrop, pressing `Escape`, or selecting a district.
  - **Native Mobile Scrolling Architecture**:
    - Overrode the desktop viewport lock (`height: 100vh; overflow: hidden;`) on screens `< 640px` with `height: auto; min-height: 100vh; overflow-y: auto; overflow-x: hidden;`, enabling native touch-momentum scrolling.
  - **Adaptive Grid & Form Controls**:
    - Telemetry cards smoothly stack from 3 columns down to a single vertical column on mobile.
    - Intelligence grid (Advisories + Crop Yield Estimator) stacks from 2 columns down to 1 column.
    - Chat & audio controls expand to 100% width with touch-friendly button targets (mic, send, sound).
  - Fully tested and verified across Desktop (1440x900), Mobile (390x844), and Tablet (768x1024) viewports (`mobile_responsive_demo_1793523773060.webp`).
* **Sidebar Slide & Slide-Back Flexbox Resolution (2026-11-01 15:55 IST):**
  - **Root Cause of Offscreen Shift**: Discovered that a negative margin (`margin-left: -320px !important`) in flexbox shifted `.main` into negative viewport coordinates (`x < 0`), causing text truncation (`a • Ludhiana`) and hiding the toggle button.
  - **Zero-Offset Collapse Architecture**:
    - Replaced negative margins with clean zero-width flexbox collapse: `width: 0 !important; min-width: 0 !important; max-width: 0 !important; flex-basis: 0 !important; flex-shrink: 1 !important; padding: 0 !important; margin: 0 !important; border-right-color: transparent !important; opacity: 0 !important; overflow: hidden !important;`.
    - Main container expands smoothly to 100% viewport width without shifting coordinates.
  - **Single 3-Dashed Line Hamburger Icon & Click Event Resolution (2026-11-01 17:50 IST)**:
    - **Eliminated Duplicate Icon**: Removed the redundant hamburger icon from the sidebar header so there is exactly ONE clean 3-dashed line button on screen (in the top bar).
    - **Crisp Vector SVG**: Replaced CSS div lines with an inline `<svg>` with integer stroke paths (`y=6, 12, 18`), guaranteeing exactly 3 crisp lines on all display scalings (100%, 125%, 150%).
    - **Resolved Click Double-Trigger**: Found and removed duplicate event listeners (`onclick="toggleSidebar()"` + `addEventListener("click")`), and added 120ms debounce plus `.hamburger-btn * { pointer-events: none; }` to ensure single-click reliability.
    - **Full Browser Verification**: Confirmed flawless collapse and slide back in live browser:
      - Collapsed: `collapsed_verified_1793535540023.png`
      - Expanded: `expanded_verified_1793535545059.png`
      - Recording: `click_hamburger_center_1793535497808.webp`.
* **Full Multilingual Localization & Dynamic Content Inconsistency Resolution (2026-11-01 19:55 IST)**:
  - **Identified Root Causes**:
    1. Telemetry-derived strings in adverse alerts (`Low Soil Moisture`, detail sentences, action plans) were previously generated as hardcoded English template strings in `data_fetcher.py`.
    2. Dynamic Yield Estimator labels (`Crop: Wheat`, `Optimal genetic potential`, `65% of genetic potential`, rating badges `🟠 Moderate`, factor breakdown descriptions) lacked multilingual lookup mappings.
    3. Metric status tags (`Clear Weather`, `Critically Dry`, `Range:`) and the initial chat welcome bubble were rendered in English without language change re-render hooks.
    4. Client-side `app.js` did not cache `latestDashboardData`, so changing the language dropdown only updated static DOM elements with `data-i18n` and left all telemetry cards, alerts, and yield estimates in English.
  - **Architectural Solution Implemented**:
    - **Structured Backend Telemetry**: Updated `data_fetcher.py` to output standard machine identifiers (`condition_id`, `soil_status_id`, `rating_id`, `factors_detailed` with factor codes).
    - **Complete Multilingual Dictionaries**: Created comprehensive translation maps across English (`en`), Hindi (`hi`), Punjabi (`pa`), and Telugu (`te`) in `config.py` and embedded in `app.js`:
      - `ALERT_TRANSLATIONS`: Localizes condition names, detail sentences with `{val}` interpolation, and complete agronomic step-by-step action plans for all 11 adverse conditions.
      - `CROP_TRANSLATIONS`: Maps English crop names to localized scripts (`Wheat` -> `गेहूँ`, `ਕਣਕ`, `గోధుమ`).
      - `RATING_TRANSLATIONS`: Localizes yield ratings (`🟠 Moderate` -> `🟠 मध्यम`, `🟠 ਮੱਧਮ`, `🟠 మధ్యస్థం`).
      - `SOIL_STATUS_TRANSLATIONS`: Localizes soil moisture health states (`Critically Dry` -> `अत्यधिक सूखी (हल्की सिंचाई आवश्यक)`).
      - `FACTOR_TRANSLATIONS`: Translates each agronomic factor breakdown item dynamically.
    - **Client-Side Reactive Cache (`latestDashboardData`)**:
      - `loadDashboard()` caches the active telemetry report.
      - `switchLanguage(lang)` immediately re-renders adverse alerts, yield estimations, weather/soil tags, Mandi range labels, and the AI assistant welcome message without requiring any page reload.
      - Synchronized via `GET /api/translations` with full zero-latency local fallbacks.
  - **Browser Verification**: Tested and verified across language toggles in the live browser (`verify_hindi_multilingual_1793542829014.webp`).
* **Sidebar Brand Badge Snug Fitting & Padding Refinement (2026-11-01 20:10 IST)**:
  - **Issue**: The rounded background box for the brand subtitle badge (`Agritech & Climate Resilience`) was stretching across the container width due to multiline wrapping, leaving an overly wide right edge that collided with the theme toggle button.
  - **Fix**: Wrapped title and badge inside `.brand-text` with `align-items: flex-start;`, set `.brand-badge` to `display: inline-flex; width: max-content; white-space: nowrap; font-size: 0.58rem; padding: 2px 6px;`, and ensured `.brand-actions` has `margin-left: 12px;`.
  - **Result**: The green pill badge now fits snugly on a single line with tight, balanced padding and more than 26px of clean breathing space separating it from the light/dark theme toggle button.











