#!/usr/bin/env bash
# ==============================================================================
# ORS Project — One-Click Developer Environment Setup
# Supported OS: macOS, Linux, Windows (Git Bash, WSL, MSYS2)
#
# Idempotent — safe to run on an empty machine or re-run anytime.
# Installs & Verifies:
#   1. Package Manager (Homebrew on macOS / winget on Windows / apt on Linux)
#   2. Git
#   3. Java Development Kit (OpenJDK 21 LTS)
#   4. Apache Maven (3.9+)
#   5. Node.js (LTS v20/v22) + npm
#   6. Docker Desktop & Docker Compose
# ==============================================================================

set -u

# ---------- Display helpers ----------
say()  { printf '\n\033[1;33m==> %s\033[0m\n' "$*"; }
ok()   { printf '  \033[32m[PASS]\033[0m  %s\n' "$*"; }
skip() { printf '  \033[36m[SKIP]\033[0m  %s (already present)\n' "$*"; }
warn() { printf '  \033[33m[WARN]\033[0m  %s\n' "$*"; }
fail() { printf '  \033[31m[FAIL]\033[0m  %s\n' "$*"; }
have() { command -v "$1" >/dev/null 2>&1; }

# ---------- OS Detect ----------
OS="unknown"
case "$(uname -s)" in
  Linux*)  OS="linux" ;;
  Darwin*) OS="macos" ;;
  CYGWIN*|MINGW*|MSYS*) OS="windows" ;;
esac

IS_WSL=0
if [ "$OS" = "linux" ] && grep -qiE "microsoft|wsl" /proc/version 2>/dev/null; then
  IS_WSL=1
fi

say "ORS Setup — Target OS: $OS$([ "$IS_WSL" = 1 ] && echo ' (WSL)')"

if [ "$OS" = "unknown" ]; then
  warn "Unrecognized shell/OS: $(uname -s)."
  warn "For Windows users: use Git Bash, WSL (Ubuntu), or double-click 'set_up.bat'."
  exit 1
fi

APT=0; [ "$OS" = "linux" ] && have apt && APT=1

# ---------- Exit Trap Debug Summary ----------
diag() {
  rc=$?
  printf '\n\033[1;36m═════════════════ ORS SETUP DIAGNOSTIC REPORT ═════════════════\033[0m\n'
  [ "$rc" -eq 0 ] && printf 'Result      : \033[32mSUCCESS\033[0m\n' || printf 'Result      : \033[31mFAILED (exit code %s)\033[0m\n' "$rc"
  echo "Timestamp   : $(date -u +%FT%TZ 2>/dev/null || date)"
  echo "OS / Kernel : $(uname -s 2>/dev/null) $(uname -r 2>/dev/null)"
  echo "Architecture: $(uname -m 2>/dev/null)"
  echo "Git         : $(git --version 2>/dev/null || echo 'Not installed')"
  echo "Java        : $(java -version 2>&1 | head -n 1 2>/dev/null || echo 'Not installed')"
  echo "Maven       : $(mvn -version 2>/dev/null | head -n 1 || echo 'Not installed')"
  echo "Node.js     : $(node --version 2>/dev/null || echo 'Not installed')"
  echo "npm         : $(npm --version 2>/dev/null || echo 'Not installed')"
  echo "Docker      : $(docker --version 2>/dev/null || echo 'Not installed')"
  echo "Compose     : $(docker compose version 2>/dev/null || echo 'Not installed')"
  printf '\033[1;36m═══════════════════════════════════════════════════════════════\033[0m\n'
}
trap diag EXIT

# ------------------------------------------------------------------------------
# 1. Package Manager Setup
# ------------------------------------------------------------------------------
say "1/6  Package Manager"
if [ "$OS" = "macos" ]; then
  if ! have brew; then
    say "Installing Homebrew for macOS..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    if [[ -f "/opt/homebrew/bin/brew" ]]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
      (echo; echo 'eval "$(/opt/homebrew/bin/brew shellenv)"') >> "$HOME/.zprofile" 2>/dev/null || true
    elif [[ -f "/usr/local/bin/brew" ]]; then
      eval "$(/usr/local/bin/brew shellenv)"
      (echo; echo 'eval "$(/usr/local/bin/brew shellenv)"') >> "$HOME/.zprofile" 2>/dev/null || true
    fi
    ok "Homebrew installed"
  else
    skip "Homebrew $(brew --version | head -1 | awk '{print $2}')"
  fi
elif [ "$OS" = "windows" ]; then
  if have winget.exe || powershell.exe -Command "Get-Command winget" >/dev/null 2>&1; then
    ok "Windows Package Manager (winget) available"
  else
    warn "winget not found. Please install App Installer from Microsoft Store or run as Administrator."
  fi
elif [ "$APT" = 1 ]; then
  sudo apt-get update -y >/dev/null 2>&1 && ok "apt package index updated"
fi

# ------------------------------------------------------------------------------
# 2. Git
# ------------------------------------------------------------------------------
say "2/6  Git"
if ! have git; then
  if [ "$OS" = "macos" ]; then
    brew install git && ok "Git installed"
  elif [ "$OS" = "windows" ]; then
    powershell.exe -Command "winget install --id Git.Git -e --silent --accept-source-agreements --accept-package-agreements" || true
    ok "Git installation triggered via winget"
  elif [ "$APT" = 1 ]; then
    sudo apt-get install -y git && ok "Git installed"
  fi
else
  skip "Git $(git --version | awk '{print $3}')"
fi

# ------------------------------------------------------------------------------
# 3. Java 21 LTS
# ------------------------------------------------------------------------------
say "3/6  Java Development Kit (JDK 21 LTS)"
NEED_JAVA=1
if have java; then
  CURRENT_JAVA_VER=$(java -version 2>&1 | head -n 1 | sed -E 's/.*version "([^"]+)".*/\1/' | cut -d'.' -f1)
  if [ "$CURRENT_JAVA_VER" = "21" ]; then
    NEED_JAVA=0
    skip "Java 21 LTS ($(java -version 2>&1 | head -n 1))"
  else
    warn "Found Java version $CURRENT_JAVA_VER, but ORS requires Java 21."
  fi
fi

if [ "$NEED_JAVA" = 1 ]; then
  if [ "$OS" = "macos" ]; then
    brew install openjdk@21
    sudo ln -sfn /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-21.jdk 2>/dev/null || true
    export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
    echo 'export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"' >> "$HOME/.zshrc" 2>/dev/null || true
    ok "OpenJDK 21 installed and linked"
  elif [ "$OS" = "windows" ]; then
    powershell.exe -Command "winget install --id EclipseAdoptium.Temurin.21.JDK -e --silent --accept-source-agreements --accept-package-agreements" || \
    powershell.exe -Command "winget install --id Microsoft.OpenJDK.21 -e --silent --accept-source-agreements --accept-package-agreements" || true
    ok "Java 21 installation triggered via winget"
  elif [ "$APT" = 1 ]; then
    sudo apt-get install -y openjdk-21-jdk && ok "OpenJDK 21 installed"
  fi
fi

# Ensure Homebrew Java is in PATH this session if installed on macOS
if [ "$OS" = "macos" ] && [ -d "/opt/homebrew/opt/openjdk@21/bin" ]; then
  export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
fi

# ------------------------------------------------------------------------------
# 4. Apache Maven
# ------------------------------------------------------------------------------
say "4/6  Apache Maven"
if ! have mvn; then
  if [ "$OS" = "macos" ]; then
    brew install maven && ok "Maven installed"
  elif [ "$OS" = "windows" ]; then
    powershell.exe -Command "winget install --id Apache.Maven -e --silent --accept-source-agreements --accept-package-agreements" || true
    ok "Maven installation triggered via winget"
  elif [ "$APT" = 1 ]; then
    sudo apt-get install -y maven && ok "Maven installed"
  fi
else
  skip "Maven $(mvn -version 2>/dev/null | head -1 | awk '{print $3}')"
fi

# ------------------------------------------------------------------------------
# 5. Node.js & npm (LTS)
# ------------------------------------------------------------------------------
say "5/6  Node.js (LTS) + npm"
NEED_NODE=1
if have node; then
  NODE_MAJOR=$(node -v | sed 's/v//' | cut -d'.' -f1)
  if [ "$NODE_MAJOR" -ge 18 ]; then
    NEED_NODE=0
    skip "Node.js $(node -v) (npm: $(npm -v 2>/dev/null || echo '?'))"
  else
    warn "Node version $(node -v) is too old (< 18). Upgrading to LTS..."
  fi
fi

if [ "$NEED_NODE" = 1 ]; then
  if [ "$OS" = "macos" ]; then
    brew install node@20
    brew link --overwrite --force node@20 2>/dev/null || true
    export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
    ok "Node.js 20 LTS installed"
  elif [ "$OS" = "windows" ]; then
    powershell.exe -Command "winget install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements" || true
    ok "Node.js LTS installation triggered via winget"
  elif [ "$APT" = 1 ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >/dev/null 2>&1
    sudo apt-get install -y nodejs && ok "Node.js 20 LTS installed"
  fi
fi

# ------------------------------------------------------------------------------
# 6. Docker Desktop & Docker Compose
# ------------------------------------------------------------------------------
say "6/6  Docker Desktop & Docker Compose"
if ! have docker; then
  if [ "$OS" = "macos" ]; then
    brew install --cask docker
    warn "Docker Desktop downloaded to /Applications. Please open Docker.app once to initialize privileges."
  elif [ "$OS" = "windows" ]; then
    powershell.exe -Command "winget install --id Docker.DockerDesktop -e --silent --accept-source-agreements --accept-package-agreements" || true
    warn "Docker Desktop installed. Please restart your PC to complete WSL/Hyper-V integration."
  elif [ "$APT" = 1 ]; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker "$USER" 2>/dev/null || true
    ok "Docker engine installed"
  fi
else
  skip "Docker $(docker --version 2>/dev/null | awk '{print $3}' | tr -d ',')"
fi

# ------------------------------------------------------------------------------
# 7. Verification Matrix (Version checking with exact regex pass/fail)
# ------------------------------------------------------------------------------
say "Verifying All Requirements"
PASS=0
FAIL=0

check() {
  local name="$1"
  local cmd="$2"
  local regex="$3"
  local out

  if out=$($cmd 2>&1); then
    local first_line
    first_line=$(echo "$out" | head -n 1)
    if echo "$first_line" | grep -qE "$regex"; then
      ok "$name: $first_line"
      PASS=$((PASS + 1))
    else
      warn "$name: got '$first_line' — expected pattern: $regex"
      FAIL=$((FAIL + 1))
    fi
  else
    fail "$name is NOT accessible on PATH."
    FAIL=$((FAIL + 1))
  fi
}

check "Git"             "git --version"            "git version [0-9]+\.[0-9]+"
check "Java (JDK 21)"   "java -version"            "(openjdk|java|Corretto|Temurin).*version \"21\."
check "Apache Maven"    "mvn -version"             "Apache Maven 3\.[0-9]+"
check "Node.js (LTS)"   "node --version"           "^v(18|20|22|24)\."
check "npm"             "npm --version"            "^[0-9]+\.[0-9]+"
check "Docker CLI"      "docker --version"         "Docker version [0-9]+\."
check "Docker Compose"  "docker compose version"   "Docker Compose version v?[0-9]+\."

# ------------------------------------------------------------------------------
# 8. Final Result
# ------------------------------------------------------------------------------
say "Result: $PASS Passed, $FAIL Failed"

if [ "$FAIL" -eq 0 ]; then
  printf '\n\033[32m✔ SUCCESS: Your machine is 100%% ready to run the ORS project!\033[0m\n'
  echo -e "\nTo start the project:"
  echo -e "  1. Start MySQL:    \033[1;33m./startInfra.sh\033[0m"
  echo -e "  2. Start Backend:  \033[1;33mcd ../ors-server && mvn spring-boot:run\033[0m"
  echo -e "  3. Start Frontend: \033[1;33mcd ../ors-frontend && npm install && npm run dev\033[0m\n"
  exit 0
else
  warn "$FAIL check(s) did not match. If you just installed tools, CLOSE this terminal, open a new one, and re-run."
  exit 1
fi
