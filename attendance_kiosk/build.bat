@echo off
echo ==============================================
echo   Building Attendance Kiosk EXE
echo ==============================================

cd /d "%~dp0"

echo [1/3] Installing dependencies...
pip install -r requirements.txt
pip install pyinstaller

echo [2/4] Generating application icon from logo...
python create_icon.py

echo [3/4] Building EXE (with embedded config)...
python -m PyInstaller --onefile --windowed --clean ^
    --name "AttendanceKiosk" ^
    --icon "app_icon.ico" ^
    --add-data "templates;templates" ^
    --add-data "static;static" ^
    --add-data "config.json;." ^
    --hidden-import flask ^
    --hidden-import requests ^
    server.py

echo [4/4] Finalizing build...
REM No longer copying config.json to dist as it is now embedded.


echo.
echo ============================================
echo   Done! EXE is in: dist\AttendanceKiosk.exe
echo   IMPORTANT: Edit dist\config.json first:
echo   - Set cloud_base_url to your Vercel URL
echo   - Set company_name
echo ============================================
pause
