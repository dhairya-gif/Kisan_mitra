@echo off
title Kisan Mitra - Share Public Link
color 0B
cls
echo =====================================================================
echo           🌾 KISAN MITRA - PUBLIC INTERNET TUNNEL 🌾
echo =====================================================================
echo.
echo Starting Cloudflare Tunnel to expose your local website to the internet...
echo.
echo  * Local URL:    http://localhost:8501
echo.
echo  Please wait a few seconds while your public HTTPS link is generated...
echo =====================================================================
echo.
cloudflared tunnel --url http://localhost:8501
pause
