@echo off
REM Quantum Circuit Simulator - Setup Script for Windows

echo.
echo Quantum Circuit Simulator - Full Stack Setup
echo =============================================
echo.

REM Frontend
echo Setting up Frontend...
cd frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)
echo [OK] Frontend ready
cd ..

REM Backend
echo.
echo Setting up Backend...
cd backend
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)
echo [OK] Backend ready
cd ..

echo.
echo Setup complete!
echo.
echo To start the application:
echo.
echo Command Prompt 1 (Frontend):
echo   cd frontend && npm run dev
echo.
echo Command Prompt 2 (Backend):
echo   cd backend && venv\Scripts\activate && python app.py
echo.
echo Then open: http://localhost:5173
echo.
pause
