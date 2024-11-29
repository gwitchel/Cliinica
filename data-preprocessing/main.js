const fs = require('fs');
const { saveCsvFile } = require('./data-preprocessing/saveCSV');
const { syncCsvFiles } = require('./data-preprocessing/syncDB');
const { readFile } = require('./data-preprocessing/readFile');
const { loadCsvData } = require('./data-preprocessing/loadCSVData');
const { saveFlow } = require('./data-preprocessing/saveFlow');
const { app, BrowserWindow, ipcMain } = require('electron');
const { join, basename } = require('path');
const { watch } = require('fs');

let userProfile = null;
let datetimeOn = null;
let sessionId = null; // Unique session ID for tracking user session

function logUsageToCsv(userProfile, datetimeOn, datetimeOff, sessionId) {
    const usageRecord = {
        userId: userProfile._id,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        role: userProfile.role,
        datetimeOn: datetimeOn,
        datetimeOff: datetimeOff || "None", // Use "None" if still active
        sessionId: sessionId,
    };

    const filePath = join(__dirname, 'usage-record.csv');
    
    // Read the existing data to append or update
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) throw err;
        
        let records = data ? data.split('\n') : [];
        
        // If the record for this session already exists, update it; otherwise, add a new one
        const existingIndex = records.findIndex(record => record.includes(sessionId));
        if (existingIndex >= 0) {
            // Update the record with datetimeOff if already exists (i.e., app is closing)
            records[existingIndex] = `${usageRecord.userId},${usageRecord.firstName},${usageRecord.lastName},${usageRecord.role},${usageRecord.datetimeOn},${usageRecord.datetimeOff},${usageRecord.sessionId}`;
        } else {
            // Add a new row if sessionId is not found
            const newRow = `${usageRecord.userId},${usageRecord.firstName},${usageRecord.lastName},${usageRecord.role},${usageRecord.datetimeOn},${usageRecord.datetimeOff},${usageRecord.sessionId}`;
            records.push(newRow);
        }
        
        // Save updated data back to CSV
        fs.writeFile(filePath, records.join('\n'), 'utf8', (err) => {
            if (err) throw err;
            console.log('Usage record logged to usage-record.csv');
        });
    });
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: false,
        },
    });

    mainWindow.loadFile(join(__dirname, 'dist', 'index.html'));
    // mainWindow.webContents.openDevTools();
}

// Read the user profile from the JSON file
function readUserProfile() {
    const userProfilePath = join(__dirname, 'user-profile.json');
    
    return new Promise((resolve, reject) => {
        fs.readFile(userProfilePath, 'utf8', (err, data) => {
            if (err) return reject(err);
            resolve(JSON.parse(data));
        });
    });
}

// IPC handlers for loading and saving CSV data
ipcMain.handle('load-csv', async (event, sheetName) => {
    const filePath = filePaths.find(file => basename(file) === `${sheetName}.csv`);
    if (filePath) {
        return await loadCsvData(filePath);
    } else {
        throw new Error(`File for sheet "${sheetName}" not found.`);
    }
});

ipcMain.on('save-csv', (event, filePath, data) => {
    saveCsvFile(filePath, data); // Save CSV data to file
});

// IPC handler for loading the user profile
ipcMain.handle('load-user-profile', async () => {
    try {
        return await readUserProfile();
    } catch (err) {
        console.error('Error loading user profile:', err);
        throw err;
    }
});

ipcMain.on('save-flow', (event, flow) => {
    saveFlow(flow);
    event.reply('flow-saved', 'Flow saved successfully');
});

// Watch both CSV files for changes
const filePaths = [
    join(__dirname, 'Deidentified - referrals.csv'),
    join(__dirname, 'referrals-legacy.csv'),
    join(__dirname, 'processed-referrals.csv'),
    join(__dirname, 'usage-record.csv'),
    join(__dirname, 'changelog.csv'),
    join(__dirname, 'organization.csv'),
];

filePaths.forEach(filePath => {
    watch(filePath, (eventType) => {
        if (eventType === 'change') {
            BrowserWindow.getAllWindows().forEach(window => {
                window.webContents.send('csv-updated', basename(filePath));
            });
        }
    });
});

app.whenReady()
   .then(syncCsvFiles)   // Call syncCsvFiles first to ensure files are in sync
   .then(() => readUserProfile())  // Read user profile
   .then(user => {
       userProfile = user;  // Store user profile for later use
       datetimeOn = new Date().toISOString();  // Capture datetime when the app opens
       sessionId = `${userProfile._id}-${datetimeOn}`;  // Create a unique session ID based on user ID and datetime
       logUsageToCsv(userProfile, datetimeOn, "None", sessionId);  // Log time on to CSV with "None" for time off
       createWindow();  // Then create the main window
   })
   .catch(err => {
       console.error('Error reading user profile:', err);
   });

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
    const datetimeOff = new Date().toISOString();  // Capture datetime when the app closes
    if (userProfile) {
        logUsageToCsv(userProfile, datetimeOn, datetimeOff, sessionId); // Update the usage record with time off
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
