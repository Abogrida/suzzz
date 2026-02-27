@echo off
echo ==============================================
echo   Building Attendance Kiosk EXE
echo ==============================================

cd /d "%~dp0"

echo [1/3] Installing dependencies...
pip install -r requirements.txt
pip install pyinstaller

echo [2/3] Building EXE...
pyinstaller --onefile --windowed ^
    --name "AttendanceKiosk" ^
    --add-data "templates;templates" ^
    --add-data "static;static" ^
    --add-data "config.json;." ^
    --hidden-import flask ^
    --hidden-import requests ^
    server.py

echo [3/3] Copying config...
if not exist dist\config.json copy config.json dist\config.json

echo.
echo ============================================
echo   Done! EXE is in: dist\AttendanceKiosk.exe
echo   IMPORTANT: Edit dist\config.json first:
echo   - Set cloud_base_url to your Vercel URL
echo   - Set company_name
echo ============================================
pause
