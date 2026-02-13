#!/usr/bin/env bash

# ============================================================
#  RainbowLab — One-Click Setup & Launch (Linux / macOS)
# ============================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}[OK]${NC} $1"; }
info() { echo -e "  ${YELLOW}[INFO]${NC} $1"; }
warn() { echo -e "  ${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "  ${RED}[ERROR]${NC} $1"; }
step() { echo -e "${BOLD}[$1]${NC} $2"; echo ""; }

print_banner() {
    echo ""
    echo -e "${CYAN}  ====================================================${NC}"
    echo -e "${PURPLE}   ____       _       _                   _          _     ${NC}"
    echo -e "${PURPLE}  |  _ \\ __ _(_)_ __ | |__   _____      _| |    __ _| |__  ${NC}"
    echo -e "${PURPLE}  | |_) / _\` | | '_ \\| '_ \\ / _ \\ \\ /\\ / / |   / _\` | '_ \\ ${NC}"
    echo -e "${PURPLE}  |  _ < (_| | | | | | |_) | (_) \\ V  V /| |__| (_| | |_) |${NC}"
    echo -e "${PURPLE}  |_| \\_\\__,_|_|_| |_|_.__/ \\___/ \\_/\\_/ |_____\\__,_|_.__/ ${NC}"
    echo ""
    echo -e "${CYAN}   Interactive Hash Security Suite${NC}"
    echo -e "${CYAN}  ====================================================${NC}"
    echo ""
}

# Get the directory where this script lives (works even if called via symlink)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_banner

# ============================================================
# KILL PREVIOUS INSTANCES
# ============================================================
step "0/6" "Cleaning up previous instances..."

kill_port() {
    local port=$1
    if command -v lsof &>/dev/null; then
        local pid=$(lsof -ti :$port 2>/dev/null)
        if [ -n "$pid" ]; then
            kill $pid 2>/dev/null
            info "Killed process on port $port (PID: $pid)"
        fi
    elif command -v fuser &>/dev/null; then
        fuser -k $port/tcp 2>/dev/null
    fi
}

kill_port 8000
kill_port 5173
ok "Ports cleared"
echo ""

# ============================================================
# CHECK PREREQUISITES
# ============================================================
step "1/6" "Checking prerequisites..."

# Check Python (try python3 first, then python)
PYTHON_CMD=""
for cmd in python3 python; do
    if command -v $cmd &>/dev/null; then
        ver=$($cmd --version 2>&1)
        if echo "$ver" | grep -q "Python 3"; then
            PYTHON_CMD=$cmd
            ok "Python found: $ver"
            break
        fi
    fi
done

if [ -z "$PYTHON_CMD" ]; then
    err "Python 3.10+ is not installed."
    echo "  Install it:"
    echo "    macOS:   brew install python3"
    echo "    Ubuntu:  sudo apt install python3 python3-venv python3-pip"
    echo "    Fedora:  sudo dnf install python3 python3-pip"
    echo "    Arch:    sudo pacman -S python python-pip"
    exit 1
fi

# Check for python3-venv on Debian/Ubuntu
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if ! $PYTHON_CMD -c "import venv" 2>/dev/null; then
        err "python3-venv is not installed."
        echo "  Run: sudo apt install python3-venv"
        exit 1
    fi
fi

# Check Node.js
if ! command -v node &>/dev/null; then
    err "Node.js is not installed."
    echo "  Install it:"
    echo "    macOS:   brew install node"
    echo "    Ubuntu:  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs"
    echo "    Fedora:  sudo dnf install nodejs"
    echo "    Or use nvm: https://github.com/nvm-sh/nvm"
    exit 1
fi

NODE_VERSION=$(node --version)
ok "Node.js found: $NODE_VERSION"

# Determine package manager (prefer pnpm > npm)
PKG_MANAGER="npm"
if command -v pnpm &>/dev/null; then
    PKG_MANAGER="pnpm"
    ok "pnpm found (preferred)"
else
    info "pnpm not found, using npm"
    info "Tip: Install pnpm for faster installs: npm install -g pnpm"
fi

echo ""

# ============================================================
# SETUP BACKEND
# ============================================================
step "2/6" "Setting up Python backend..."

# Determine venv paths
VENV_PATH="$SCRIPT_DIR/backend/venv"

if [ -f "$VENV_PATH/bin/python" ]; then
    PIP_CMD="$VENV_PATH/bin/pip"
    PYTHON_VENV="$VENV_PATH/bin/python"
elif [ -f "$VENV_PATH/Scripts/python.exe" ]; then
    # Git Bash / MSYS2 on Windows
    PIP_CMD="$VENV_PATH/Scripts/pip.exe"
    PYTHON_VENV="$VENV_PATH/Scripts/python.exe"
else
    # Venv missing or broken — recreate
    if [ -d "$VENV_PATH" ]; then
        info "Removing broken virtual environment..."
        rm -rf "$VENV_PATH"
    fi
    info "Creating virtual environment..."
    $PYTHON_CMD -m venv "$VENV_PATH"
    if [ $? -ne 0 ]; then
        err "Failed to create virtual environment."
        exit 1
    fi
    ok "Virtual environment created"

    # Set paths after creation
    if [ -f "$VENV_PATH/bin/python" ]; then
        PIP_CMD="$VENV_PATH/bin/pip"
        PYTHON_VENV="$VENV_PATH/bin/python"
    elif [ -f "$VENV_PATH/Scripts/python.exe" ]; then
        PIP_CMD="$VENV_PATH/Scripts/pip.exe"
        PYTHON_VENV="$VENV_PATH/Scripts/python.exe"
    else
        err "Could not find python in virtual environment."
        exit 1
    fi
fi

ok "Virtual environment ready"

# Always run pip install to catch new/missing deps
info "Checking Python dependencies..."
$PIP_CMD install -r "$SCRIPT_DIR/backend/requirements.txt" --quiet 2>/dev/null
if [ $? -ne 0 ]; then
    warn "pip install had issues, retrying verbosely..."
    $PIP_CMD install -r "$SCRIPT_DIR/backend/requirements.txt"
    if [ $? -ne 0 ]; then
        err "Failed to install Python dependencies."
        exit 1
    fi
fi
ok "Python dependencies up to date"

echo ""

# ============================================================
# SETUP FRONTEND
# ============================================================
step "3/6" "Setting up React frontend..."

# Always run install to catch new/missing deps
info "Checking frontend dependencies..."
(cd "$SCRIPT_DIR/frontend" && $PKG_MANAGER install)
if [ $? -ne 0 ]; then
    err "Failed to install frontend dependencies."
    exit 1
fi
ok "Frontend dependencies up to date"

echo ""

# ============================================================
# PORT CONFIG
# ============================================================
BACKEND_PORT=8000
FRONTEND_PORT=5173

step "4/6" "Port configuration"
echo "  Backend:  http://localhost:$BACKEND_PORT"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo ""

# ============================================================
# CLEANUP FUNCTION
# ============================================================
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down RainbowLab...${NC}"
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID" 2>/dev/null
        wait "$BACKEND_PID" 2>/dev/null
        ok "Backend stopped"
    fi
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID" 2>/dev/null
        wait "$FRONTEND_PID" 2>/dev/null
        ok "Frontend stopped"
    fi
    echo -e "${GREEN}Goodbye!${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# ============================================================
# START BACKEND
# ============================================================
step "5/6" "Starting backend server..."

(cd "$SCRIPT_DIR/backend" && $PYTHON_VENV -m uvicorn app:app --host 0.0.0.0 --port $BACKEND_PORT --reload) &
BACKEND_PID=$!
ok "Backend starting on http://localhost:$BACKEND_PORT (PID: $BACKEND_PID)"

info "Waiting for backend to initialize..."
sleep 3

# Check if backend is still running
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    err "Backend failed to start! Check the error output above."
    exit 1
fi

# ============================================================
# START FRONTEND
# ============================================================
step "6/6" "Starting frontend server..."

(cd "$SCRIPT_DIR/frontend" && $PKG_MANAGER run dev) &
FRONTEND_PID=$!
ok "Frontend starting on http://localhost:$FRONTEND_PORT (PID: $FRONTEND_PID)"

info "Waiting for frontend to initialize..."
sleep 5

# ============================================================
# OPEN BROWSER
# ============================================================
echo ""
echo -e "${CYAN}  ====================================================${NC}"
echo -e "${GREEN}   RainbowLab is ready!${NC}"
echo ""
echo -e "   Frontend:  ${BOLD}http://localhost:$FRONTEND_PORT${NC}"
echo -e "   Backend:   ${BOLD}http://localhost:$BACKEND_PORT${NC}"
echo -e "   API Docs:  ${BOLD}http://localhost:$BACKEND_PORT/docs${NC}"
echo -e "${CYAN}  ====================================================${NC}"
echo ""

# Open browser (cross-platform)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:$FRONTEND_PORT" 2>/dev/null
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v xdg-open &>/dev/null; then
        xdg-open "http://localhost:$FRONTEND_PORT" 2>/dev/null &
    elif command -v gnome-open &>/dev/null; then
        gnome-open "http://localhost:$FRONTEND_PORT" 2>/dev/null &
    else
        info "Open http://localhost:$FRONTEND_PORT in your browser"
    fi
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    start "http://localhost:$FRONTEND_PORT" 2>/dev/null
fi

ok "Browser opened"

echo ""
echo -e "  Press ${BOLD}Ctrl+C${NC} to stop both servers and exit."
echo ""

# Keep script running until interrupted
wait
