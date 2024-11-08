const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const fastCsv = require('fast-csv');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    mainWindow.webContents.openDevTools();
}

// Read CSV File Function
function readCsvFile() {
    const results = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(path.join(__dirname, 'Deidentified - referrals.csv'))
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

// Save CSV File Function
function saveCsvFile(data) {
    return new Promise((resolve, reject) => {
        const csvStream = fastCsv.format({ headers: true });
        const writeStream = fs.createWriteStream(path.join(__dirname, 'Deidentified - referrals.csv'));

        writeStream.on('finish', resolve);
        writeStream.on('error', reject);

        csvStream.pipe(writeStream);
        data.forEach((row) => csvStream.write(row));
        csvStream.end();
    });
}

// Handle loading and saving CSV data from renderer
ipcMain.handle('load-csv', async () => {
    return await readCsvFile();
});

ipcMain.handle('save-csv', async (event, updatedData) => {
    await saveCsvFile(updatedData);
});

// Set up a file watcher on the CSV file
const csvFilePath = path.join(__dirname, 'Deidentified - referrals.csv');
fs.watch(csvFilePath, (eventType) => {
    if (eventType === 'change') {
        BrowserWindow.getAllWindows().forEach(window => {
            window.webContents.send('csv-updated');
        });
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
