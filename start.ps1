# ============================================================
#  RainbowLab — One-Click Setup & Launch (PowerShell)
#  Works on: Windows PowerShell 5.1+ / PowerShell Core 7+
# ============================================================

function Write-Color {
    param([string]$Text, [ConsoleColor]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Write-Ok   { param([string]$Msg) Write-Host "  [OK] " -ForegroundColor Green -NoNewline; Write-Host $Msg }
function Write-Info { param([string]$Msg) Write-Host "  [INFO] " -ForegroundColor Yellow -NoNewline; Write-Host $Msg }
function Write-Err  { param([string]$Msg) Write-Host "  [ERROR] " -ForegroundColor Red -NoNewline; Write-Host $Msg }
function Write-Step { param([string]$Num, [string]$Msg) Write-Host "[$Num] " -ForegroundColor Cyan -NoNewline; Write-Host $Msg; Write-Host "" }

# Banner
Write-Host ""
Write-Color "  ====================================================" Cyan
Write-Color "   ____       _       _                   _          _     " Magenta
Write-Color "  |  _ \ __ _(_)_ __ | |__   _____      _| |    __ _| |__  " Magenta
Write-Color "  | |_) / _`` | | '_ \| '_ \ / _ \ \ /\ / / |   / _`` | '_ \ " Magenta
Write-Color "  |  _ < (_| | | | | | |_) | (_) \ V  V /| |__| (_| | |_) |" Magenta
Write-Color "  |_| \_\__,_|_|_| |_|_.__/ \___/ \_/\_/ |_____\__,_|_.__/ " Magenta
Write-Host ""
Write-Color "   Interactive Hash Security Suite" Cyan
Write-Color "  ====================================================" Cyan
Write-Host ""

# CD to script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# ============================================================
# KILL PREVIOUS INSTANCES
# ============================================================
Write-Step "0/6" "Cleaning up previous instances..."

function Stop-PortProcess {
    param([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        try {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Info "Killed process on port $Port (PID: $($conn.OwningProcess))"
        } catch {}
    }
}

Stop-PortProcess 8000
Stop-PortProcess 5173
# Also clean up any previous PS jobs from this session
Get-Job | Where-Object { $_.Name -match "Rainbow" -or $_.Command -match "uvicorn|vite|dev" } | Stop-Job -ErrorAction SilentlyContinue -PassThru | Remove-Job -Force -ErrorAction SilentlyContinue
Write-Ok "Ports cleared"
Write-Host ""

# ============================================================
# CHECK PREREQUISITES
# ============================================================
Write-Step "1/6" "Checking prerequisites..."

$PythonCmd = $null
foreach ($cmd in @("python", "python3")) {
    try {
        $ver = & $cmd --version 2>&1
        if ($ver -match "Python 3") {
            $PythonCmd = $cmd
            Write-Ok "Python found: $ver"
            break
        }
    } catch {}
}

if (-not $PythonCmd) {
    Write-Err "Python 3.10+ is required but not found."
    Write-Host "  Download from: https://www.python.org/downloads/"
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    $NodeVer = & node --version 2>&1
    Write-Ok "Node.js found: $NodeVer"
} catch {
    Write-Err "Node.js is not installed."
    Write-Host "  Download from: https://nodejs.org/"
    Read-Host "Press Enter to exit"
    exit 1
}

$PkgManager = "npm"
try {
    $null = & pnpm --version 2>&1
    $PkgManager = "pnpm"
    Write-Ok "pnpm found (preferred)"
} catch {
    Write-Info "pnpm not found, using npm"
}

Write-Host ""

# ============================================================
# SETUP BACKEND
# ============================================================
Write-Step "2/6" "Setting up Python backend..."

$BackendDir = Join-Path $ScriptDir "backend"
$VenvPath = Join-Path $BackendDir "venv"
$IsWindows_ = ($env:OS -eq "Windows_NT") -or ($PSVersionTable.Platform -eq "Win32NT") -or (-not $PSVersionTable.Platform)

if (-not (Test-Path $VenvPath)) {
    Write-Info "Creating virtual environment..."
    & $PythonCmd -m venv "$VenvPath"
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to create virtual environment."
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Ok "Virtual environment created"
} else {
    Write-Ok "Virtual environment already exists"
}

if ($IsWindows_) {
    $ScriptsDir = Join-Path $VenvPath "Scripts"
    $PipCmd = Join-Path $ScriptsDir "pip.exe"
    $PythonVenv = Join-Path $ScriptsDir "python.exe"
} else {
    $BinDir = Join-Path $VenvPath "bin"
    $PipCmd = Join-Path $BinDir "pip"
    $PythonVenv = Join-Path $BinDir "python"
}

if (-not (Test-Path $PipCmd)) {
    Write-Info "pip not found, running ensurepip..."
    & $PythonVenv -m ensurepip --upgrade 2>&1 | Out-Null
    if (-not (Test-Path $PipCmd)) {
        Write-Err "Could not find or install pip."
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Info "Installing Python dependencies..."
$reqFile = Join-Path $BackendDir "requirements.txt"

$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& $PipCmd install -r $reqFile --quiet 2>&1 | Out-Null
$pipExit = $LASTEXITCODE
$ErrorActionPreference = $prevEAP

if ($pipExit -ne 0) {
    Write-Err "Failed to install Python dependencies."
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Ok "Python dependencies installed"

Write-Host ""

# ============================================================
# SETUP FRONTEND
# ============================================================
Write-Step "3/6" "Setting up React frontend..."

$FrontendDir = Join-Path $ScriptDir "frontend"

# Always run install to catch new/missing deps
Write-Info "Checking frontend dependencies..."
Push-Location $FrontendDir
& $PkgManager install
Pop-Location
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to install frontend dependencies."
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Ok "Frontend dependencies up to date"

Write-Host ""

# ============================================================
# PORT CONFIG
# ============================================================
$BackendPort = 8000
$FrontendPort = 5173

Write-Step "4/6" "Checking ports..."
Write-Host "  Backend:  http://localhost:$BackendPort"
Write-Host "  Frontend: http://localhost:$FrontendPort"
Write-Host ""

# ============================================================
# START BACKEND
# ============================================================
Write-Step "5/6" "Starting backend server..."

$BackendJob = Start-Job -ScriptBlock {
    param($PyCmd, $Port, $Dir)
    Set-Location $Dir
    & $PyCmd -m uvicorn app:app --host 0.0.0.0 --port $Port --reload 2>&1
} -ArgumentList $PythonVenv, $BackendPort, $BackendDir

Write-Ok "Backend starting on http://localhost:$BackendPort (Job: $($BackendJob.Id))"
Write-Info "Waiting for backend to initialize..."
Start-Sleep -Seconds 3

$bState = (Get-Job -Id $BackendJob.Id).State
if ($bState -eq "Failed") {
    Write-Err "Backend failed to start!"
    Receive-Job -Id $BackendJob.Id
    Read-Host "Press Enter to exit"
    exit 1
}

# ============================================================
# START FRONTEND
# ============================================================
Write-Step "6/6" "Starting frontend server..."

$FrontendJob = Start-Job -ScriptBlock {
    param($Mgr, $Dir)
    Set-Location $Dir
    & $Mgr run dev 2>&1
} -ArgumentList $PkgManager, $FrontendDir

Write-Ok "Frontend starting on http://localhost:$FrontendPort (Job: $($FrontendJob.Id))"
Write-Info "Waiting for frontend to initialize..."
Start-Sleep -Seconds 5

# ============================================================
# OPEN BROWSER
# ============================================================
Write-Host ""
Write-Color "  ====================================================" Cyan
Write-Color "   RainbowLab is ready!" Green
Write-Host ""
Write-Host "   Frontend:  " -NoNewline; Write-Color "http://localhost:$FrontendPort" White
Write-Host "   Backend:   " -NoNewline; Write-Color "http://localhost:$BackendPort" White
Write-Host "   API Docs:  " -NoNewline; Write-Color "http://localhost:$BackendPort/docs" White
Write-Color "  ====================================================" Cyan
Write-Host ""

Start-Process "http://localhost:$FrontendPort"
Write-Ok "Browser opened"

Write-Host ""
Write-Host "  Press " -NoNewline
Write-Color "Ctrl+C" Yellow
Write-Host " or close this window to stop both servers."
Write-Host ""

# Keep running
try {
    while ($true) {
        $bState = (Get-Job -Id $BackendJob.Id).State
        $fState = (Get-Job -Id $FrontendJob.Id).State

        if ($bState -eq "Failed") {
            Write-Err "Backend server crashed!"
            Receive-Job -Id $BackendJob.Id
            break
        }
        if ($fState -eq "Failed") {
            Write-Err "Frontend server crashed!"
            Receive-Job -Id $FrontendJob.Id
            break
        }

        Start-Sleep -Seconds 2
    }
} finally {
    Write-Host ""
    Write-Color "Shutting down RainbowLab..." Yellow
    Stop-Job -Id $BackendJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $BackendJob.Id -Force -ErrorAction SilentlyContinue
    Stop-Job -Id $FrontendJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $FrontendJob.Id -Force -ErrorAction SilentlyContinue
    Write-Ok "All servers stopped"
    Write-Color "Goodbye!" Green
}
