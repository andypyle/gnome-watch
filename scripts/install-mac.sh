#!/bin/sh
# Build Gnome Watch and install it to /Applications, replacing any older copy.
# Usage: npm run install:mac
set -e
cd "$(dirname "$0")/.."

APP="Gnome Watch"
ARCH=$(uname -m | sed 's/x86_64/x64/')
BUILT="dist/$APP-darwin-$ARCH/$APP.app"
DEST="/Applications/$APP.app"

# Quit the running copy politely (so it saves its agent list), and wait for it to exit.
if pgrep -x "$APP" >/dev/null 2>&1; then
  echo "Quitting $APP…"
  osascript -e "quit app \"$APP\"" >/dev/null 2>&1 || true
  i=0
  while pgrep -x "$APP" >/dev/null 2>&1 && [ $i -lt 20 ]; do sleep 0.25; i=$((i + 1)); done
fi

npm run package:mac

rm -rf "$DEST"
mv "$BUILT" "$DEST"
echo "Installed $DEST"
open "$DEST"
