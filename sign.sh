#!/usr/bin/env bash
#
# manual_mas_sign.sh
#
# Script to manually embed provisioning profiles and sign an Electron app
# for the Mac App Store, including .dylib libraries, the Electron Framework,
# nested helpers, login helper, and final .pkg.
#
# Usage: ./manual_mas_sign.sh

set -euo pipefail

##############################
# 1. CONFIGURE THESE VARIABLES
##############################

APP_BUNDLE="dist/mas/Cliinica.app"

# 3rd Party Mac Developer App certificate name (exact as Keychain shows)
CERT_APP='3rd Party Mac Developer Application: georgia witchel (RQ535HNNVW)'

# 3rd Party Mac Developer Installer certificate name for final pkg
CERT_INSTALLER='3rd Party Mac Developer Installer: georgia witchel (RQ535HNNVW)'

# Mac App Store provisioning profile path
PROVISION_PROFILE="build/Cliinica_Mac_App_Store_Profile.provisionprofile"

# Entitlements for main .app
ENTITLEMENTS_MAIN="build/entitlements.mas.plist"

# Entitlements for nested helpers
ENTITLEMENTS_INHERIT="build/entitlements.mas.inherit.plist"

# Final pkg output name
PKG_OUT="dist/Cliinica.pkg"
PKG_UNSIGNED="dist/Cliinica-unsigned.pkg"

##########################################
# 2. DEFINE HELPER + FRAMEWORK PATHS
##########################################

# Nested helper apps in Contents/Frameworks
NESTED_HELPERS=(
  "Contents/Frameworks/Cliinica Helper.app"
  "Contents/Frameworks/Cliinica Helper (GPU).app"
  "Contents/Frameworks/Cliinica Helper (Plugin).app"
  "Contents/Frameworks/Cliinica Helper (Renderer).app"
)

# Login helper in Contents/Library/LoginItems (if present)
LOGIN_HELPER="Contents/Library/LoginItems/Cliinica Login Helper.app"

# The Electron Framework directory
ELECTRON_FRAMEWORK_DIR="$APP_BUNDLE/Contents/Frameworks/Electron Framework.framework"

# The main Electron Framework executable inside Versions/A
ELECTRON_FRAMEWORK_BIN="$ELECTRON_FRAMEWORK_DIR/Versions/A/Electron Framework"

# .dylib files that often need explicit signing
DYLIBS=(
  "libEGL.dylib"
  "libGLESv2.dylib"
  "libffmpeg.dylib"
  "libvk_swiftshader.dylib"
)

###############################################
# 3. FUNCTION TO SIGN A NESTED HELPER .app
###############################################
sign_nested_app() {
  local HELPER_PATH="$1"

  echo "Embedding provisioning profile into $HELPER_PATH"
  cp "$PROVISION_PROFILE" "$APP_BUNDLE/$HELPER_PATH/Contents/embedded.provisionprofile"

  echo "Signing nested helper app: $HELPER_PATH"
  codesign --force \
    --sign "$CERT_APP" \
    --entitlements "$ENTITLEMENTS_INHERIT" \
    --options runtime \
    "$APP_BUNDLE/$HELPER_PATH"
}

###############################################
# 4. SIGN EACH NESTED HELPER
###############################################
echo "==== Signing nested helpers ===="
for HELPER in "${NESTED_HELPERS[@]}"; do
  if [ -d "$APP_BUNDLE/$HELPER" ]; then
    sign_nested_app "$HELPER"
  else
    echo "WARNING: $APP_BUNDLE/$HELPER not found, skipping."
  fi
done

# Sign login helper if it exists
if [ -d "$APP_BUNDLE/$LOGIN_HELPER" ]; then
  sign_nested_app "$LOGIN_HELPER"
else
  echo "No Login Helper found at $APP_BUNDLE/$LOGIN_HELPER, skipping."
fi

###############################################
# 5. SIGN THE ELECTRON FRAMEWORK + .DYLIBs
###############################################
echo "==== Signing Electron Framework binaries and dylibs ===="

# 5.1 Sign each .dylib in Versions/A/Libraries
for dylib in "${DYLIBS[@]}"; do
  LIB_PATH="$ELECTRON_FRAMEWORK_DIR/Versions/A/Libraries/$dylib"
  if [ -f "$LIB_PATH" ]; then
    echo "Signing $dylib ..."
    codesign --force \
      --sign "$CERT_APP" \
      --entitlements "$ENTITLEMENTS_INHERIT" \
      --options runtime \
      "$LIB_PATH"
  else
    echo "WARNING: $LIB_PATH not found, skipping."
  fi
done

# 5.2 Sign the main Electron Framework executable
if [ -f "$ELECTRON_FRAMEWORK_BIN" ]; then
  echo "Signing Electron Framework binary ..."
  codesign --force \
    --sign "$CERT_APP" \
    --entitlements "$ENTITLEMENTS_INHERIT" \
    --options runtime \
    "$ELECTRON_FRAMEWORK_BIN"
else
  echo "WARNING: $ELECTRON_FRAMEWORK_BIN not found!"
fi

# 5.3 Finally sign the entire Electron Framework.framework folder
if [ -d "$ELECTRON_FRAMEWORK_DIR" ]; then
  echo "Signing Electron Framework.framework folder ..."
  codesign --force \
    --sign "$CERT_APP" \
    --entitlements "$ENTITLEMENTS_INHERIT" \
    --options runtime \
    "$ELECTRON_FRAMEWORK_DIR"
else
  echo "WARNING: Electron Framework.framework not found!"
fi

###############################################
# 6. SIGN THE MAIN .APP
###############################################
echo "==== Embedding provisioning profile & signing main app ===="
cp "$PROVISION_PROFILE" "$APP_BUNDLE/Contents/embedded.provisionprofile"

echo "Signing main .app: $APP_BUNDLE"
codesign --force \
  --sign "$CERT_APP" \
  --entitlements "$ENTITLEMENTS_MAIN" \
  --options runtime \
  "$APP_BUNDLE"

###############################################
# 7. VERIFY LOCALLY (deep verification)
###############################################
echo "==== Verifying code signature (deep) locally ===="
codesign --verify --deep --strict --verbose=4 "$APP_BUNDLE"

echo "Local codesign verification done."

###############################################
# 8. BUILD A .PKG & SIGN WITH INSTALLER CERT
###############################################
echo "==== Creating unsigned .pkg ===="
productbuild \
  --component "$APP_BUNDLE" /Applications \
  "$PKG_UNSIGNED"

echo "==== Signing .pkg with 3rd Party Mac Developer Installer ===="
productsign \
  --sign "$CERT_INSTALLER" \
  "$PKG_UNSIGNED" \
  "$PKG_OUT"

echo "==== Verifying final .pkg signature ===="
productsign --verify "$PKG_OUT" || true

echo "==== Manual MAS signing complete ===="
echo "Final pkg at: $PKG_OUT"
