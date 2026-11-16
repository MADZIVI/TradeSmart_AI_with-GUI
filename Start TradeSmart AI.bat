@echo off
REM One-click launcher for TradeSmart AI.
REM Double-click this file. It starts the backend (which also serves the
REM built frontend) and opens your browser automatically. Leave the black
REM window open while you use the app - closing it stops the app.

cd /d "%~dp0tradesmart-backend"

if not exist venv\Scripts\activate.bat (
    echo.
    echo [TradeSmart AI] No virtual environment found in tradesmart-backend\venv
    echo Run the one-time setup first - see tradesmart-backend\README.md
    echo.
    pause
    exit /b 1
)

call venv\Scripts\activate.bat

if not exist "..\tradesmart-aura\dist\index.html" (
    echo.
    echo [TradeSmart AI] Frontend hasn't been built yet.
    echo Run "npm run build" inside tradesmart-aura once, then try again.
    echo See tradesmart-aura\README.md for details.
    echo.
    pause
    exit /b 1
)

echo.
echo [TradeSmart AI] Starting... your browser will open automatically.
echo Leave this window open while you use the app. Close it to stop.
echo.

python app.py

pause
