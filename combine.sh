#!/usr/bin/env bash
#
# merge_universal.sh
#
# Merges x64 and arm64 Electron .apps into one universal .app,
# then re-signs it for Mac App Store distribution.
#
# Prerequisites:
#   1) "dist/mas-x64/Cliinica.app"  (Intel build)
#   2) "dist/mas-arm64/Cliinica.app" (Apple Silicon build)
#   3) A valid 3rd Party Mac Developer Application certificate in Keychain
#   4) The same provisioning profile for each sub-bundle
#   5) Entitlements for main app and for sub-helpers
#
# Usage:
#   ./merge_universal.sh

set -euo pipefail

##############################
# 1. CONFIGURE VARIABLES
##############################

# Name of your .app
APP_NAME="Cliinica.app"

# The x64 build output
X64_APP="dist/mas-x64/${APP_NAME}"

# The arm64 build output
ARM_APP="dist/mas-arm64/${APP_NAME}"

# The final universal output
UNI_DIR="dist/mas-universal"
UNI_APP="${UNI_DIR}/${APP_NAME}"

# 3rd Party Mac Developer Application certificate name
CERT_APP='3rd Party Mac Developer Application: georgia witchel (RQ535HNNVW)'

# Path to your MAS provisioning profile (for each sub-bundle)
PROVISION_PROFILE="build/Cliinica_Mac_App_Store_Profile.provisionprofile"

# Entitlements for main app
ENTITLEMENTS_MAIN="build/entitlements.mas.plist"

# Entitlements for nested helpers
ENTITLEMENTS_INHERIT="build/entitlements.mas.inherit.plist"

##############################
# 2. CLEAN + COPY X64 AS BASE
##############################
echo "==== Preparing universal directory ===="
rm -rf "$UNI_DIR"
mkdir -p "$UNI_DIR"

echo "Copying x64 .app as the base into $UNI_DIR"
cp -R "$X64_APP" "$UNI_DIR"

##############################
# 3. DEFINE EXECUTABLES TO MERGE
##############################
# The main .app binary
EXECUTABLES=(
  "Contents/MacOS/Cliinica"
)

# Electron Framework main binary
EXECUTABLES+=(
  "Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework"
)

# Electron Helper apps
EXECUTABLES+=(
  "Contents/Frameworks/Cliinica Helper.app/Contents/MacOS/Cliinica Helper"
  "Contents/Frameworks/Cliinica Helper (GPU).app/Contents/MacOS/Cliinica Helper (GPU)"
  "Contents/Frameworks/Cliinica Helper (Plugin).app/Contents/MacOS/Cliinica Helper (Plugin)"
  "Contents/Frameworks/Cliinica Helper (Renderer).app/Contents/MacOS/Cliinica Helper (Renderer)"
  "Contents/Library/LoginItems/Cliinica Login Helper.app/Contents/MacOS/Cliinica Login Helper"
)

# Common .dylib files inside Electron Framework
EXECUTABLES+=(
  "Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libEGL.dylib"
  "Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libGLESv2.dylib"
  "Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib"
  "Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libvk_swiftshader.dylib"
)

##############################
# 4. LIPO-MERGE x64 + arm64
##############################
for execPath in "${EXECUTABLES[@]}"; do
  X64_BIN="${X64_APP}/${execPath}"
  ARM_BIN="${ARM_APP}/${execPath}"
  UNI_BIN="${UNI_APP}/${execPath}"

  # If both slices exist, merge them
  if [[ -f "$X64_BIN" && -f "$ARM_BIN" ]]; then
    echo "Merging $execPath"
    lipo "$X64_BIN" "$ARM_BIN" -create -output "$UNI_BIN"
  else
    echo "WARNING: Skipping $execPath (not found in one of the apps)"
  fi
done

##############################
# 5. EMBED PROVISIONING PROFILE + SIGN SUB-BUNDLES
##############################
echo "==== Embedding provisioning profiles + signing sub-bundles ===="

function sign_sub_app() {
  local SUB_APP="$1"
  if [[ -d "$UNI_APP/$SUB_APP" ]]; then
    echo "  -> $SUB_APP"
    cp "$PROVISION_PROFILE" "$UNI_APP/$SUB_APP/Contents/embedded.provisionprofile"
    codesign --force \
      --sign "$CERT_APP" \
      --entitlements "$ENTITLEMENTS_INHERIT" \
      --options runtime \
      "$UNI_APP/$SUB_APP"
  fi
}

# Sign the nested helper .app(s)
sign_sub_app "Contents/Frameworks/Cliinica Helper.app"
sign_sub_app "Contents/Frameworks/Cliinica Helper (GPU).app"
sign_sub_app "Contents/Frameworks/Cliinica Helper (Plugin).app"
sign_sub_app "Contents/Frameworks/Cliinica Helper (Renderer).app"
sign_sub_app "Contents/Library/LoginItems/Cliinica Login Helper.app"

# If you want to sign .dylib individually, do it here
# But typically we sign the entire framework folder after lipo
# For example:
function sign_lib() {
  local LIB_PATH="$1"
  if [[ -f "$UNI_APP/$LIB_PATH" ]]; then
    echo "  -> $LIB_PATH"
    codesign --force \
      --sign "$CERT_APP" \
      --entitlements "$ENTITLEMENTS_INHERIT" \
      --options runtime \
      "$UNI_APP/$LIB_PATH"
  fi
}

# sign dylibs
sign_lib "Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libEGL.dylib"
sign_lib "Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libGLESv2.dylib"
sign_lib "Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib"
sign_lib "Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libvk_swiftshader.dylib"

# sign the electron framework
if [[ -d "$UNI_APP/Contents/Frameworks/Electron Framework.framework" ]]; then
  codesign --force \
    --sign "$CERT_APP" \
    --entitlements "$ENTITLEMENTS_INHERIT" \
    --options runtime \
    "$UNI_APP/Contents/Frameworks/Electron Framework.framework"
fi

##############################
# 6. EMBED PROFILE + SIGN MAIN .APP
##############################
echo "==== Signing main .app ===="
cp "$PROVISION_PROFILE" "$UNI_APP/Contents/embedded.provisionprofile"
codesign --force \
  --sign "$CERT_APP" \
  --entitlements "$ENTITLEMENTS_MAIN" \
  --options runtime \
  "$UNI_APP"

##############################
# 7. VERIFY
##############################
echo "==== Verifying final universal .app ===="
codesign --verify --deep --strict --verbose=4 "$UNI_APP"

# Check architecture
echo "==== Checking architecture of merged app binary ===="
lipo -info "$UNI_APP/Contents/MacOS/Cliinica"

echo "==== Done merging universal app at: $UNI_APP ===="
