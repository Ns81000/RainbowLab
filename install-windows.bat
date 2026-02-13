@echo off
REM ============================================================
REM  RainbowLab — One-Command Installer + Desktop Shortcut
REM  Run this in any folder. It will:
REM    1) Clone the repo
REM    2) Install all dependencies
REM    3) Create a desktop shortcut
REM    4) Launch the app
REM ============================================================

title RainbowLab Installer

echo.
echo  ============================================================
echo   RainbowLab — One-Command Installer for Windows
echo  ============================================================
echo.

REM --- Check git ---
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed.
    echo         Download from: https://git-scm.com/
    pause
    exit /b 1
)

REM --- Check python ---
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python 3 is not installed.
    echo         Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM --- Check node ---
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo         Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/5] Cloning RainbowLab...
if exist "%USERPROFILE%\RainbowLab" (
    echo       Already exists, pulling latest...
    cd /d "%USERPROFILE%\RainbowLab"
    git pull
) else (
    git clone https://github.com/Ns81000/RainbowLab.git "%USERPROFILE%\RainbowLab"
    cd /d "%USERPROFILE%\RainbowLab"
)
echo [OK] Repository ready
echo.

echo [2/5] Setting up Python backend...
cd /d "%USERPROFILE%\RainbowLab\backend"
if not exist "venv" (
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt --quiet
echo [OK] Python dependencies installed
echo.

echo [3/5] Setting up React frontend...
cd /d "%USERPROFILE%\RainbowLab\frontend"
where pnpm >nul 2>&1
if %errorlevel% equ 0 (
    pnpm install
) else (
    npm install
)
echo [OK] Frontend dependencies installed
echo.

echo [4/5] Creating desktop shortcut...
REM Create a VBS script to make a proper Windows shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\RainbowLab.lnk" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "powershell.exe" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Arguments = "-ExecutionPolicy Bypass -File ""%USERPROFILE%\RainbowLab\start.ps1""" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%USERPROFILE%\RainbowLab" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.IconLocation = "%USERPROFILE%\RainbowLab\frontend\public\favicon.ico,0" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Description = "RainbowLab - Interactive Hash Security Suite" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"
cscript //nologo "%TEMP%\CreateShortcut.vbs"
del "%TEMP%\CreateShortcut.vbs"
echo [OK] Desktop shortcut created (RainbowLab)
echo.

echo [5/5] Launching RainbowLab...
cd /d "%USERPROFILE%\RainbowLab"
powershell -ExecutionPolicy Bypass -File start.ps1
