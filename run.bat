@echo off
title Kisan Mitra - Multilingual Agritech Assistant
color 0A
cls
echo =====================================================================
echo           🌾 KISAN MITRA - AGRITECH AI VOICE ASSISTANT 🌾
echo =====================================================================
echo.
echo Starting local web server on port 8501...
echo.
echo  * Local access:             http://localhost:8501
echo  * Network access (LAN/WiFi):
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0.*0.0.0.0 ^| findstr /v "127.0.0.1"') do (
    echo    http://%%a:8501
    goto :ip_found
)
:ip_found
echo.
echo  Open the network URL on any phone or laptop connected to the same Wi-Fi!
echo =====================================================================
echo.
python -B server.py
pause
