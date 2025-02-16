// sign.js
const { signApp } = require('@electron/osx-sign');
const { notarize } = require('@electron/notarize');

async function main() {
  const appPath = 'dist/mac/Cliinica-darwin-arm64/Cliinica.app';

  try {
    // 1) Sign the app using Developer ID
    await signApp({
      app: appPath,
      identity: 'Developer ID Application: georgia witchel (RQ535HNNVW)', // <--- your exact cert name
      hardenedRuntime: true,
      entitlements: 'build/entitlements.mac.plist',       // If you have them
      'entitlements-inherit': 'build/entitlements.mac.inherit.plist',
      // If the private key is blocked, see 'security set-key-partition-list' steps
      ignore: [
        '.*\\.pak$',
        '.*\\.lproj/.*',
        '.*\\.icudtl.*',
        'chrome_crashpad_handler$'
      ]
    });
    console.log('App signed successfully!');

    // 2) (Optional) Notarize the app
    // Provide Apple ID credentials via environment variables or inline
    await notarize({
      appBundleId: 'com.cliinica.cliinica',   // your actual app bundle ID
      appPath: appPath,
      appleId: process.env.APPLE_ID || 'gwitchel@gmail.com',       // or inline
      appleIdPassword: process.env.APPLEIDPASS || 'Sal1mand3r', // or inline
      // teamId: 'RQ535HNNVW' // if Apple ID spans multiple teams, specify
    });
    console.log('App notarized successfully!');
    
  } catch (err) {
    console.error('Error signing or notarizing app:', err);
    process.exit(1);
  }
}

main();
