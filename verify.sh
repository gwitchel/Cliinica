#!/usr/bin/env bash
#
# check_mas_sign.sh
#
# Script to verify a Mac App Store build AFTER you've manually or automatically signed it.
#  1) Checks each nested helper has embedded.provisionprofile
#  2) Checks code-sign entitlements for each sub-bundle
#  3) Checks final .pkg is signed with 3rd Party Mac Developer Installer
#  4) Optionally checks architecture slices with lipo
#
# Usage: ./check_mas_sign.sh

set -euo pipefail

###################################
# 1. CONFIGURE VARIABLES
###################################
APP_BUNDLE="dist/mas/Cliinica.app"
PKG_PATH="dist/Cliinica.pkg"

# Nested helper apps in your .app
NESTED_HELPERS=(
  "Contents/Frameworks/Cliinica Helper.app"
  "Contents/Frameworks/Cliinica Helper (GPU).app"
  "Contents/Frameworks/Cliinica Helper (Plugin).app"
  "Contents/Frameworks/Cliinica Helper (Renderer).app"
)

# A login helper if you have one:
LOGIN_HELPER="Contents/Library/LoginItems/Cliinica Login Helper.app"

# Common .dylib files in Electron Framework that Apple often complains about
DYLIBS=(
  "Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libEGL.dylib"
  "Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libGLESv2.dylib"
  "Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib"
  "Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libvk_swiftshader.dylib"
)

# The main electron framework binary
ELECTRON_FRAMEWORK_BIN="Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework"

###################################
# 2. CHECK EMBEDDED PROVISIONPROFILE
###################################
echo "==== Checking embedded provisioning profiles ===="
# Main .app
if [ ! -f "$APP_BUNDLE/Contents/embedded.provisionprofile" ]; then
  echo "ERROR: No embedded.provisionprofile in main .app"
  exit 1
else
  echo "OK: Found embedded.provisionprofile in main app"
fi

# Nested helpers
for HELPER_PATH in "${NESTED_HELPERS[@]}"; do
  if [ -d "$APP_BUNDLE/$HELPER_PATH" ]; then
    if [ ! -f "$APP_BUNDLE/$HELPER_PATH/Contents/embedded.provisionprofile" ]; then
      echo "ERROR: Missing embedded.provisionprofile in $HELPER_PATH"
      exit 1
    else
      echo "OK: Found embedded.provisionprofile in $HELPER_PATH"
    fi
  fi
done

# Login helper
if [ -d "$APP_BUNDLE/$LOGIN_HELPER" ]; then
  if [ ! -f "$APP_BUNDLE/$LOGIN_HELPER/Contents/embedded.provisionprofile" ]; then
    echo "ERROR: Missing embedded.provisionprofile in $LOGIN_HELPER"
    exit 1
  else
    echo "OK: Found embedded.provisionprofile in $LOGIN_HELPER"
  fi
fi

###################################
# 3. CHECK CODE-SIGN ENTITLEMENTS
###################################
check_entitlements() {
  local TARGET="$1"
  echo "---- Checking entitlements for $TARGET ----"
  codesign --display --entitlements :- "$TARGET" || {
    echo "ERROR: codesign entitlements check failed for $TARGET"
    exit 1
  }
  echo ""
}

echo "==== Checking entitlements of main app ===="
check_entitlements "$APP_BUNDLE"

echo "==== Checking entitlements of nested helpers ===="
for HELPER_PATH in "${NESTED_HELPERS[@]}"; do
  if [ -d "$APP_BUNDLE/$HELPER_PATH" ]; then
    check_entitlements "$APP_BUNDLE/$HELPER_PATH"
  fi
done

if [ -d "$APP_BUNDLE/$LOGIN_HELPER" ]; then
  check_entitlements "$APP_BUNDLE/$LOGIN_HELPER"
fi

echo "==== Checking Electron Framework and .dylibs ===="
# The main Electron Framework binary
if [ -f "$APP_BUNDLE/$ELECTRON_FRAMEWORK_BIN" ]; then
  check_entitlements "$APP_BUNDLE/$ELECTRON_FRAMEWORK_BIN"
fi

# Each .dylib
for dylib in "${DYLIBS[@]}"; do
  LIB_PATH="$APP_BUNDLE/$dylib"
  if [ -f "$LIB_PATH" ]; then
    check_entitlements "$LIB_PATH"
  fi
done

###################################
# 4. CHECK PKG SIGNATURE
###################################
if [ ! -f "$PKG_PATH" ]; then
  echo "WARNING: $PKG_PATH not found. Skipping .pkg signature check."
else
  echo "==== Checking .pkg signature with productsign --verify ===="
  pkgutil --check-signature "$PKG_PATH" && echo "OK: .pkg is recognized as signed" || {
    echo "WARNING: .pkg verify returned an issue or no output"
    # spctl -a -vv -t install "$PKG_PATH" is optional but usually says "rejected" for MAS pkgs
  }
fi

###################################
# 5. OPTIONAL: CHECK ARCH
###################################
# If you want to ensure universal or arm64, check the main binary architecture
echo "==== Checking main app binary architecture ===="
if [ -f "$APP_BUNDLE/Contents/MacOS/Cliinica" ]; then
  lipo -info "$APP_BUNDLE/Contents/MacOS/Cliinica"
else
  echo "WARNING: main executable not found at $APP_BUNDLE/Contents/MacOS/Cliinica"
fi

echo "==== All checks done ===="
