#!/bin/bash
# Patches the dev Electron binary's Info.plist so macOS shows "dbstudio"
# instead of "Electron" in the dock, Cmd+Tab, and menu bar.
# Runs automatically via postinstall.

APP_NAME="dbstudio"
ELECTRON_APP="node_modules/electron/dist/Electron.app"
PLIST="$ELECTRON_APP/Contents/Info.plist"

if [ ! -f "$PLIST" ]; then
  exit 0
fi

# Patch the display name and bundle name
/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName $APP_NAME" "$PLIST" 2>/dev/null
/usr/libexec/PlistBuddy -c "Set :CFBundleName $APP_NAME" "$PLIST" 2>/dev/null
/usr/libexec/PlistBuddy -c "Set :CFBundleExecutable $APP_NAME" "$PLIST" 2>/dev/null || true

# Rename the executable so macOS picks up the new name
EXEC_DIR="$ELECTRON_APP/Contents/MacOS"
if [ -f "$EXEC_DIR/Electron" ] && [ ! -f "$EXEC_DIR/$APP_NAME" ]; then
  cp "$EXEC_DIR/Electron" "$EXEC_DIR/$APP_NAME"
fi

# Copy app icon into the bundle so macOS shows it in dock / Cmd+Tab
RESOURCES_DIR="$ELECTRON_APP/Contents/Resources"
if [ -f "build/icon.icns" ]; then
  cp "build/icon.icns" "$RESOURCES_DIR/electron.icns"
fi

echo "Patched Electron.app display name and icon to '$APP_NAME'"
