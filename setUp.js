const fs = require('fs');
const path = require('path');
const { app, dialog } = require('electron');

// Function to get and save OneDrive path
async function setupOneDrivePath() {
    const userResponse = await dialog.showOpenDialog({
        title: "Select Your OneDrive Folder",
        properties: ["openDirectory"],
        message: "Please select your OneDrive directory to configure the app.",
    });

    if (userResponse.canceled || !userResponse.filePaths.length) {
        console.log("User canceled the setup.");
        return;
    }

    const oneDrivePath = userResponse.filePaths[0];
    console.log("Selected OneDrive Path:", oneDrivePath);

    // Save the path to a configuration file
    const configPath = path.join(app.getPath('userData'), 'config.json');
    const configData = { oneDrivePath };

    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    console.log(`OneDrive path saved to config: ${configPath}`);
}

// Load the OneDrive path from the configuration file
function loadOneDrivePath() {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    if (fs.existsSync(configPath)) {
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return configData.oneDrivePath;
    }
    return null;
}

module.exports = { setupOneDrivePath, loadOneDrivePath };
