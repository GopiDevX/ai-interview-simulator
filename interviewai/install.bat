@echo off
echo ====================================
echo  InterviewAI - Installing Dependencies
echo ====================================
echo.
echo Node version:
node --version
echo.

echo [1/2] Installing SERVER dependencies...
cd /d "c:\Projects\AI Interview Platfrom\interviewai\server"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Server install failed
    pause
    exit /b 1
)
echo [OK] Server dependencies installed!

echo.
echo [2/2] Installing CLIENT dependencies...
cd /d "c:\Projects\AI Interview Platfrom\interviewai\client"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Client install failed
    pause
    exit /b 1
)
echo [OK] Client dependencies installed!

echo.
echo ====================================
echo  SUCCESS! All dependencies installed.
echo.
echo  Next steps:
echo  1. Run start-server.bat  (backend on port 5000)
echo  2. Run start-client.bat  (frontend on port 5173)
echo  3. Open: http://localhost:5173
echo ====================================
pause
