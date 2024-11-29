const fs = require('fs');
const promises = require('fs').promises;
const { saveCsvFile } = require('./data-preprocessing/saveCSV');
const { syncCsvFiles } = require('./data-preprocessing/syncDB');
const { readCsvFile } = require('./data-preprocessing/readCsvFile');
const { loadCsvData } = require('./data-preprocessing/loadCSVData');
const { saveFlow } = require('./data-preprocessing/saveFlow');
// import { loadJsonData } from './data-preprocessing/loadJsonData';
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const { join, basename } = require('path');
const { watch } = require('fs');

let userProfile = null;
let datetimeOn = null;
let sessionId = null; // Unique session ID for tracking user session

function logUsageToCsv(userProfile, datetimeOn, datetimeOff, sessionId) {
    // const usageRecord = {
    //     userId: userProfile._id,
    //     firstName: userProfile.firstName,
    //     lastName: userProfile.lastName,
    //     role: userProfile.role,
    //     datetimeOn: datetimeOn,
    //     datetimeOff: datetimeOff || "None", // Use "None" if still active
    //     sessionId: sessionId,
    // };

    // const filePath = join(__dirname, 'usage-record.csv');
    
    // // Read the existing data to append or update
    // fs.readCsvFile(filePath, 'utf8', (err, data) => {
    //     if (err) throw err;
        
    //     let records = data ? data.split('\n') : [];
        
    //     // If the record for this session already exists, update it; otherwise, add a new one
    //     const existingIndex = records.findIndex(record => record.includes(sessionId));
    //     if (existingIndex >= 0) {
    //         // Update the record with datetimeOff if already exists (i.e., app is closing)
    //         records[existingIndex] = `${usageRecord.userId},${usageRecord.firstName},${usageRecord.lastName},${usageRecord.role},${usageRecord.datetimeOn},${usageRecord.datetimeOff},${usageRecord.sessionId}`;
    //     } else {
    //         // Add a new row if sessionId is not found
    //         const newRow = `${usageRecord.userId},${usageRecord.firstName},${usageRecord.lastName},${usageRecord.role},${usageRecord.datetimeOn},${usageRecord.datetimeOff},${usageRecord.sessionId}`;
    //         records.push(newRow);
    //     }
        
    //     // Save updated data back to CSV
    //     fs.writeFile(filePath, records.join('\n'), 'utf8', (err) => {
    //         if (err) throw err;
    //         console.log('Usage record logged to usage-record.csv');
    //     });
    // });
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

async function loadAllJsonFiles() {
    try {
        const flowsDirectory = path.join(__dirname, 'data-preprocessing', 'flows');
        
        // Use fs.promises.readdir to list files in the directory
        const files = await promises.readdir(flowsDirectory);  // Correctly using fs.promises.readdir
        console.log("Files in directory:", files);
        // Filter to only JSON files
        const jsonFiles = files.filter(file => file.endsWith('.json'));

        // Read and parse each JSON file using fs.promises.readFile
        const allJsonData = await Promise.all(
            jsonFiles.map(async (file) => {
                const filePath = path.join(flowsDirectory, file);
                const fileContent = await promises.readFile(filePath, 'utf8');  // Correct usage of fs.promises.readFile
                return {
                    name: file,  // Store the filename
                    data: JSON.parse(fileContent)  // Parse and return the data
                };
            })
        );

        return allJsonData;
    } catch (error) {
        console.error("Error loading JSON files:", error);
        throw error; // Rethrow error to handle it in calling code
    }
}

// IPC handler for loading all JSON files from the flows directory
ipcMain.handle('load-all-json', async (event) => {
    return await loadAllJsonFiles(); // Fetch all JSON files
});

async function loadUserProfile() {
    try {
        const filePath = path.join(__dirname, 'user-profile.json');
        const fileContent = await promises.readFile(filePath, 'utf8');  // Correct usage of fs.promises.readFile
                return  JSON.parse(fileContent) 
    } catch (error) {
        console.error("Error loading JSON files:", error);
        throw error; // Rethrow error to handle it in calling code
    }
}


ipcMain.handle('load-user-profile', async (event) => {
    return await loadUserProfile(); // Fetch all JSON files
});
// Read the user profile from the JSON file


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
//    .then(syncCsvFiles)   // Call syncCsvFiles first to ensure files are in sync
   .then(() => loadUserProfile())  // Read user profile
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
