@echo off
title RainbowLab - Setup ^& Launch
color 0B

echo.
echo  ====================================================
echo    ____       _       _                   _          _     
echo   ^|  _ \ __ _(_)_ __ ^| ^|__   _____      _^| ^|    __ _^| ^|__  
echo   ^| ^|_) / _` ^| ^| '_ \^| '_ \ / _ \ \ /\ / / ^|   / _` ^| '_ \ 
echo   ^|  _ ^< (_^| ^| ^| ^| ^| ^| ^|_) ^| (_) \ V  V /^| ^|__^| (_^| ^| ^|_) ^|
echo   ^|_^| \_\__,_^|_^|_^| ^|_^|_.__/ \___/ \_/\_/ ^|_____\__,_^|_.__/ 
echo.
echo   Interactive Hash Security Suite
echo  ====================================================
echo.

:: CD to the directory where this script lives
pushd "%~dp0"

:: ============================================================
:: KILL ANY PREVIOUS INSTANCES
:: ============================================================
echo [0/6] Cleaning up previous instances...

:: Kill any existing uvicorn on port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>nul
)

:: Kill any existing vite on port 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>nul
)

echo  [OK] Ports cleared
echo.

:: ============================================================
:: CHECK PREREQUISITES
:: ============================================================
echo [1/6] Checking prerequisites...

:: Check Python (try python first, then python3, then py)
set PYTHON_CMD=
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set PYTHON_CMD=python
    goto :python_found
)
where python3 >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set PYTHON_CMD=python3
    goto :python_found
)
where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set PYTHON_CMD=py -3
    goto :python_found
)

echo  [ERROR] Python is not installed or not in PATH.
echo  Please install Python 3.10+ from https://www.python.org/downloads/
echo  Make sure to check "Add Python to PATH" during installation.
pause
popd
exit /b 1

:python_found
for /f "tokens=*" %%a in ('%PYTHON_CMD% --version 2^>^&1') do set PYTHON_VERSION=%%a
echo  [OK] %PYTHON_VERSION% found

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo  Please install Node.js 18+ from https://nodejs.org/
    pause
    popd
    exit /b 1
)
for /f "tokens=1" %%a in ('node --version 2^>^&1') do set NODE_VERSION=%%a
echo  [OK] Node.js %NODE_VERSION% found

:: Check for pnpm, npm as fallback
set PKG_MANAGER=npm
where pnpm >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set PKG_MANAGER=pnpm
    echo  [OK] pnpm found ^(preferred^)
) else (
    echo  [INFO] pnpm not found, using npm
)

echo.

:: ============================================================
:: SETUP BACKEND
:: ============================================================
echo [2/6] Setting up Python backend...

if not exist "backend\venv\Scripts\python.exe" (
    if exist "backend\venv" (
        echo  [INFO] Removing broken virtual environment...
        rmdir /s /q "backend\venv" >nul 2>nul
    )
    echo  [INFO] Creating virtual environment...
    %PYTHON_CMD% -m venv backend\venv
    if %ERRORLEVEL% neq 0 (
        echo  [ERROR] Failed to create virtual environment.
        pause
        popd
        exit /b 1
    )
    echo  [OK] Virtual environment created
) else (
    echo  [OK] Virtual environment exists
)

:: Always run pip install to catch any new/missing deps
echo  [INFO] Checking Python dependencies...
backend\venv\Scripts\pip.exe install -r backend\requirements.txt --quiet 2>nul
if %ERRORLEVEL% neq 0 (
    echo  [WARN] pip install had issues, retrying without --quiet...
    backend\venv\Scripts\pip.exe install -r backend\requirements.txt
    if %ERRORLEVEL% neq 0 (
        echo  [ERROR] Failed to install Python dependencies.
        pause
        popd
        exit /b 1
    )
)
echo  [OK] Python dependencies up to date

echo.

:: ============================================================
:: SETUP FRONTEND
:: ============================================================
echo [3/6] Setting up React frontend...

:: Always run install to catch any new/missing deps
echo  [INFO] Checking frontend dependencies...
pushd frontend
%PKG_MANAGER% install
if %ERRORLEVEL% neq 0 (
    echo  [ERROR] Failed to install frontend dependencies.
    popd
    pause
    popd
    exit /b 1
)
popd
echo  [OK] Frontend dependencies up to date

echo.

:: ============================================================
:: PORT CONFIG
:: ============================================================
set BACKEND_PORT=8000
set FRONTEND_PORT=5173

echo [4/6] Port configuration
echo  Backend:  http://localhost:%BACKEND_PORT%
echo  Frontend: http://localhost:%FRONTEND_PORT%
echo.

:: ============================================================
:: START BACKEND SERVER
:: ============================================================
echo [5/6] Starting backend server...
start "RainbowLab Backend" /min cmd /c "cd /d "%~dp0backend" && venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port %BACKEND_PORT% --reload"
echo  [OK] Backend starting on http://localhost:%BACKEND_PORT%

:: Wait for backend to be ready
echo  [INFO] Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

:: ============================================================
:: START FRONTEND SERVER
:: ============================================================
echo [6/6] Starting frontend server...
start "RainbowLab Frontend" /min cmd /c "cd /d "%~dp0frontend" && %PKG_MANAGER% run dev"
echo  [OK] Frontend starting on http://localhost:%FRONTEND_PORT%

:: Wait for frontend to be ready
echo  [INFO] Waiting for frontend to initialize...
timeout /t 5 /nobreak >nul

:: ============================================================
:: OPEN BROWSER
:: ============================================================
echo.
echo  ====================================================
echo   RainbowLab is ready!
echo.
echo   Frontend:  http://localhost:%FRONTEND_PORT%
echo   Backend:   http://localhost:%BACKEND_PORT%
echo   API Docs:  http://localhost:%BACKEND_PORT%/docs
echo  ====================================================
echo.
echo  Opening browser...

start http://localhost:%FRONTEND_PORT%

echo.
echo  Both servers are running in minimized windows.
echo.
echo  To stop: close the "RainbowLab Backend" and
echo           "RainbowLab Frontend" terminal windows.
echo.

popd
pause
