#!/bin/bash
set -euo pipefail

REPO="blueprintui/webq"
INSTALL_DIR="$HOME/.local/bin"
BINARY_NAME="webq"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Detect OS and architecture
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin)
    case "$ARCH" in
      arm64) TARGET="webq-macos-arm64" ;;
      x86_64) TARGET="webq-macos-x64" ;;
      *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    ;;
  Linux)
    case "$ARCH" in
      x86_64) TARGET="webq-linux-x64" ;;
      aarch64) TARGET="webq-linux-arm64" ;;
      *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    ;;
  *)
    echo "Unsupported OS: $OS"
    echo "For Windows, download the binary manually from:"
    echo "  https://github.com/$REPO/releases/latest"
    exit 1
    ;;
esac

echo "Detected $OS ($ARCH)"

# Use local binary if available (in dist/ relative to script), otherwise download
if [ -f "$SCRIPT_DIR/dist/$TARGET" ]; then
  echo "Installing from local build..."
  SOURCE="$SCRIPT_DIR/dist/$TARGET"
else
  echo "Downloading $TARGET..."
  DOWNLOAD_URL="https://github.com/$REPO/releases/latest/download/$TARGET"
  SOURCE="$(mktemp)"
  curl -fsSL "$DOWNLOAD_URL" -o "$SOURCE"
fi

chmod +x "$SOURCE"

# Applying ad-hoc code signature for MacOS
if [ "$OS" = "Darwin" ]; then
  codesign --sign - --force "$SOURCE"
fi

DEST="$INSTALL_DIR/$BINARY_NAME"

if [ -w "$INSTALL_DIR" ]; then
  cp "$SOURCE" "$DEST"
else
  echo "Installing to $INSTALL_DIR (requires sudo)..."
  sudo cp "$SOURCE" "$DEST"
fi

echo "Installed $BINARY_NAME to $DEST"
echo ""
echo "Run 'webq --help' to get started."
