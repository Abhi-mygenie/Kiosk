#!/usr/bin/env bash
#
# KioskApp - Local Android Build Script
# ======================================
# Builds the React Native Android APK on your local machine.
#
# Prerequisites:
#   - macOS, Linux, or Windows (with WSL/Git Bash)
#   - JDK 17 (install: https://adoptium.net/temurin/releases/?version=17)
#   - Android SDK with:
#       - Platform: android-36
#       - Build Tools: 36.0.0
#       - NDK: 27.1.12297006
#   - Node.js >= 18 (install: https://nodejs.org)
#
# Quick setup (macOS with Homebrew):
#   brew install --cask temurin@17
#   brew install node
#   # Install Android Studio: https://developer.android.com/studio
#   # Or just command-line tools: https://developer.android.com/studio#command-line-tools-only
#
# Usage:
#   chmod +x build.sh
#   ./build.sh            # Build release APK
#   ./build.sh debug      # Build debug APK
#   ./build.sh clean      # Clean and rebuild
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[BUILD]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Resolve script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

BUILD_TYPE="${1:-release}"

# ---------- Pre-flight checks ----------

log "Checking prerequisites..."

# Check Java
if ! command -v java &>/dev/null; then
  error "JDK 17 is required. Install from https://adoptium.net/temurin/releases/?version=17"
fi
JAVA_VER=$(java -version 2>&1 | head -1 | grep -oP '\"(\d+)' | tr -d '"')
if [[ "$JAVA_VER" -lt 17 ]]; then
  error "JDK 17+ is required (found JDK $JAVA_VER). Install from https://adoptium.net/temurin/releases/?version=17"
fi
log "Java $JAVA_VER OK"

# Check Node
if ! command -v node &>/dev/null; then
  error "Node.js >= 18 is required. Install from https://nodejs.org"
fi
log "Node $(node -v) OK"

# Check ANDROID_HOME / ANDROID_SDK_ROOT
if [[ -z "${ANDROID_HOME:-}" ]] && [[ -z "${ANDROID_SDK_ROOT:-}" ]]; then
  # Try common locations
  if [[ -d "$HOME/Library/Android/sdk" ]]; then
    export ANDROID_HOME="$HOME/Library/Android/sdk"
  elif [[ -d "$HOME/Android/Sdk" ]]; then
    export ANDROID_HOME="$HOME/Android/Sdk"
  elif [[ -d "/usr/local/lib/android/sdk" ]]; then
    export ANDROID_HOME="/usr/local/lib/android/sdk"
  else
    error "ANDROID_HOME not set. Install Android Studio or set ANDROID_HOME to your SDK path."
  fi
  warn "Auto-detected ANDROID_HOME=$ANDROID_HOME"
fi
export ANDROID_HOME="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
log "Android SDK: $ANDROID_HOME"

# Check required SDK packages
SDKMANAGER="$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager"
if [[ -f "$SDKMANAGER" ]]; then
  MISSING_PKGS=""
  [[ -d "$ANDROID_HOME/platforms/android-36" ]]     || MISSING_PKGS="$MISSING_PKGS platforms;android-36"
  [[ -d "$ANDROID_HOME/build-tools/36.0.0" ]]       || MISSING_PKGS="$MISSING_PKGS build-tools;36.0.0"
  [[ -d "$ANDROID_HOME/ndk/27.1.12297006" ]]         || MISSING_PKGS="$MISSING_PKGS ndk;27.1.12297006"

  if [[ -n "$MISSING_PKGS" ]]; then
    log "Installing missing SDK packages:$MISSING_PKGS"
    yes | "$SDKMANAGER" --licenses >/dev/null 2>&1 || true
    $SDKMANAGER $MISSING_PKGS
  fi
else
  warn "sdkmanager not found. Ensure android-36, build-tools 36.0.0, and NDK 27.1.12297006 are installed."
fi

# ---------- Install dependencies ----------

log "Installing Node dependencies..."
npm install

# ---------- Write local.properties ----------

echo "sdk.dir=$ANDROID_HOME" > android/local.properties

# ---------- Build ----------

cd android
chmod +x gradlew

if [[ "$BUILD_TYPE" == "clean" ]]; then
  log "Cleaning..."
  ./gradlew clean --no-daemon
  BUILD_TYPE="release"
fi

if [[ "$BUILD_TYPE" == "debug" ]]; then
  log "Building DEBUG APK..."
  ./gradlew assembleDebug --no-daemon
  APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
else
  log "Building RELEASE APK..."
  ./gradlew assembleRelease --no-daemon
  APK_PATH="app/build/outputs/apk/release/app-release.apk"
fi

# ---------- Done ----------

if [[ -f "$APK_PATH" ]]; then
  APK_SIZE=$(du -sh "$APK_PATH" | cut -f1)
  log "========================================="
  log "  BUILD SUCCESSFUL!"
  log "  APK: $(pwd)/$APK_PATH"
  log "  Size: $APK_SIZE"
  log "========================================="
  log ""
  log "Install on device:"
  log "  adb install $APK_PATH"
else
  error "APK not found at expected path: $APK_PATH"
fi
