// scripts/afterSign.js
const fs = require("fs");
const path = require("path");
const os = require("os");
const plist = require("plist");
const { execFileSync } = require("child_process");

/**
 * After electron-builder signs the main app, we re-sign each helper so it
 * has a valid com.apple.application-identifier that matches our wildcard
 * provisioning profile. We put the temporary entitlements file OUTSIDE
 * the .app folder to avoid "unsealed contents" errors.
 */
module.exports = async function afterSign(context) {
  const { electronPlatformName, appOutDir } = context;

  // Only process MAS builds
  if (electronPlatformName !== "mas") {
    return;
  }

  // The "3rd Party Mac Developer Application" certificate in your Keychain
  const signingIdentity = "3rd Party Mac Developer Application: georgia witchel (RQ535HNNVW)";

  // If you have a separate wildcard provisioning profile for helpers:
  const helpersProfile = path.join(
    __dirname,
    "..",
    "build",
    "Cliinica_provisioning_profile.provisionprofile"
  );

  // The main .app (e.g., dist/mas-arm64/Cliinica.app)
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  // Possible helper sub-apps
  const helperApps = [
    "Cliinica Helper.app",
    "Cliinica Helper (Renderer).app",
    "Cliinica Helper (Plugin).app",
    "Cliinica Helper (GPU).app",
    "Cliinica Login Helper.app",
  ];

  for (const helperName of helperApps) {
    const helperPath = path.join(appPath, "Contents", "Frameworks", helperName);
    if (!fs.existsSync(helperPath)) {
      continue; // Skip if helper not present
    }

    // 1) Read CFBundleIdentifier from the helper's Info.plist
    const infoPlistPath = path.join(helperPath, "Contents", "Info.plist");
    if (!fs.existsSync(infoPlistPath)) {
      continue;
    }

    const infoData = plist.parse(fs.readFileSync(infoPlistPath, "utf8"));
    const helperBundleId = infoData.CFBundleIdentifier;
    if (!helperBundleId) {
      console.warn(`No CFBundleIdentifier in ${infoPlistPath}; skipping.`);
      continue;
    }

    // 2) Build dynamic entitlements for this helper
    // Adjust for your required sandbox permissions if needed
    const entitlementsObj = {
      "com.apple.security.app-sandbox": true,
      // If your helpers need network, etc.
      "com.apple.security.network.client": true,
      "com.apple.security.network.server": true,
      // The critical application-identifier
      "com.apple.application-identifier": `RQ535HNNVW.${helperBundleId}`,
    };

    // 3) Write entitlements to a TEMP location (not inside the .app)
    const tmpEntitlementsPath = path.join(
      os.tmpdir(),
      `helper-${helperName.replace(/\s/g, "-")}-entitlements.plist`
    );
    fs.writeFileSync(tmpEntitlementsPath, plist.build(entitlementsObj), "utf8");

    // 4) (Optional) Copy wildcard provisioning profile into the helper
    const destProfile = path.join(helperPath, "Contents", "embedded.provisionprofile");
    if (fs.existsSync(helpersProfile)) {
      fs.copyFileSync(helpersProfile, destProfile);
    }

    // 5) Re-sign the helper with the dynamic entitlements
    console.log(
      `Re-signing ${helperName} with ID: RQ535HNNVW.${helperBundleId}`
    );
    execFileSync("codesign", [
      "--sign",
      signingIdentity,
      "--force",
      "--deep",
      "--options",
      "runtime",
      "--entitlements",
      tmpEntitlementsPath,
      helperPath
    ], { stdio: "inherit" });

    // 6) Clean up the temporary entitlements
    fs.unlinkSync(tmpEntitlementsPath);
  }
};
