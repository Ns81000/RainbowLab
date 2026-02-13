#!/usr/bin/env bash
# ============================================================
#  RainbowLab — One-Command Installer + Desktop Shortcut
#  Works on: Linux (Ubuntu/Fedora/Arch) + macOS
#
#  Usage:
#    curl -fsSL https://raw.githubusercontent.com/Ns81000/RainbowLab/main/install.sh | bash
# ============================================================

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'; NC='\033[0m'; BOLD='\033[1m'

ok()   { echo -e "  ${GREEN}[OK]${NC} $1"; }
info() { echo -e "  ${YELLOW}[INFO]${NC} $1"; }
err()  { echo -e "  ${RED}[ERROR]${NC} $1"; }
step() { echo -e "${CYAN}[$1]${NC} $2\n"; }

INSTALL_DIR="$HOME/RainbowLab"
OS="$(uname -s)"

echo ""
echo -e "${CYAN}  ============================================================${NC}"
echo -e "${MAGENTA}   ____       _       _                   _          _     ${NC}"
echo -e "${MAGENTA}  |  _ \\ __ _(_)_ __ | |__   _____      _| |    __ _| |__  ${NC}"
echo -e "${MAGENTA}  | |_) / _\` | | '_ \\| '_ \\ / _ \\ \\ /\\ / / |   / _\` | '_ \\ ${NC}"
echo -e "${MAGENTA}  |  _ < (_| | | | | | |_) | (_) \\ V  V /| |__| (_| | |_) |${NC}"
echo -e "${MAGENTA}  |_| \\_\\__,_|_|_| |_|_.__/ \\___/ \\_/\\_/ |_____\\__,_|_.__/ ${NC}"
echo ""
echo -e "${CYAN}   Interactive Hash Security Suite — Installer${NC}"
echo -e "${CYAN}  ============================================================${NC}"
echo ""

# ============================================================
# PREREQUISITES
# ============================================================
step "1/5" "Checking prerequisites..."

command -v git >/dev/null 2>&1 || { err "Git is not installed. Install it first."; exit 1; }
ok "Git found"

PYTHON_CMD=""
for cmd in python3 python; do
    if command -v "$cmd" >/dev/null 2>&1; then
        VER=$("$cmd" --version 2>&1)
        if echo "$VER" | grep -q "Python 3"; then
            PYTHON_CMD="$cmd"
            ok "Python found: $VER"
            break
        fi
    fi
done

if [ -z "$PYTHON_CMD" ]; then
    err "Python 3 is required. Install it first."
    exit 1
fi

command -v node >/dev/null 2>&1 || { err "Node.js is not installed. Visit https://nodejs.org/"; exit 1; }
ok "Node.js found: $(node --version)"

PKG_MANAGER="npm"
if command -v pnpm >/dev/null 2>&1; then
    PKG_MANAGER="pnpm"
    ok "pnpm found (preferred)"
else
    info "pnpm not found, using npm"
fi

echo ""

# ============================================================
# CLONE / PULL
# ============================================================
step "2/5" "Getting RainbowLab..."

if [ -d "$INSTALL_DIR" ]; then
    info "Already exists, pulling latest..."
    cd "$INSTALL_DIR"
    git pull --ff-only 2>/dev/null || true
else
    git clone https://github.com/Ns81000/RainbowLab.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi
ok "Repository ready at $INSTALL_DIR"
echo ""

# ============================================================
# BACKEND
# ============================================================
step "3/5" "Setting up Python backend..."

cd "$INSTALL_DIR/backend"
if [ ! -d "venv" ]; then
    $PYTHON_CMD -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt --quiet
ok "Python dependencies installed"
deactivate
echo ""

# ============================================================
# FRONTEND
# ============================================================
step "4/5" "Setting up React frontend..."

cd "$INSTALL_DIR/frontend"
$PKG_MANAGER install
ok "Frontend dependencies installed"
echo ""

# ============================================================
# DESKTOP SHORTCUT
# ============================================================
step "5/5" "Creating desktop shortcut..."

DESKTOP_DIR="$HOME/Desktop"
[ ! -d "$DESKTOP_DIR" ] && DESKTOP_DIR="$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")"
mkdir -p "$DESKTOP_DIR"

if [ "$OS" = "Darwin" ]; then
    # macOS — create an .command file
    SHORTCUT="$DESKTOP_DIR/RainbowLab.command"
    cat > "$SHORTCUT" << 'MACOS_EOF'
#!/usr/bin/env bash
cd "$HOME/RainbowLab"
bash start.sh
MACOS_EOF
    chmod +x "$SHORTCUT"
    ok "macOS shortcut created at: $SHORTCUT"

else
    # Linux — create a .desktop file
    SHORTCUT="$DESKTOP_DIR/RainbowLab.desktop"
    cat > "$SHORTCUT" << LINUX_EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=RainbowLab
Comment=Interactive Hash Security Suite
Exec=bash -c "cd $INSTALL_DIR && bash start.sh"
Icon=$INSTALL_DIR/frontend/public/favicon.svg
Terminal=true
Categories=Education;Security;Development;
StartupNotify=true
LINUX_EOF
    chmod +x "$SHORTCUT"
    # Mark as trusted on GNOME
    gio set "$SHORTCUT" metadata::trusted true 2>/dev/null || true
    ok "Linux desktop shortcut created"
fi

echo ""

# ============================================================
# LAUNCH
# ============================================================
echo -e "${CYAN}  ============================================================${NC}"
echo -e "${GREEN}   Installation complete!${NC}"
echo ""
echo -e "   📁 Installed to: ${BOLD}$INSTALL_DIR${NC}"
echo -e "   🖥️  Desktop shortcut: ${BOLD}$SHORTCUT${NC}"
echo -e "${CYAN}  ============================================================${NC}"
echo ""

read -p "  Launch RainbowLab now? (Y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo ""
    ok "To launch later, double-click the desktop shortcut or run:"
    echo "    cd $INSTALL_DIR && bash start.sh"
else
    echo ""
    cd "$INSTALL_DIR"
    bash start.sh
fi
