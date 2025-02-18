require('dotenv').config();
const { notarize } = require('@electron/notarize');
const path = require('path');

module.exports = async function notarizing(context) {
//   const appOutDir = context.appOutDir;
//   const appName = context.packager.appInfo.productFilename;

//   console.log("🚀 Notarization process started...");

//   try {
//     await notarize({
//       appBundleId: "com.georgiawitchel.cliinica", // Replace with your actual app ID
//       appPath: path.join(appOutDir, `${appName}.app`),
//       appleId: process.env.APPLE_ID || "your-apple-id@example.com",
//       teamId: process.env.TEAM_ID || "YOUR_TEAM_ID",
//       appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD || "@keychain:AC_PASSWORD",
//     });

//     console.log("✅ Notarization successful!");
//   } catch (error) {
//     console.error("❌ Notarization failed:", error);
//     process.exit(1);
//   }
};
