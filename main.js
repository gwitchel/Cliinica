const fs = require('fs');
const promises = require('fs').promises;
const path = require('path');
const { parse } = require('json2csv');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { join, basename } = require('path');
const csvParser = require('csv-parser');
const os = require('os'); // For detecting user-specific paths
const { get } = require('http');


async function getBasePath() {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    console.log("Config path:", configPath);
    let oneDrivePath = null;

    // Check if the config file exists
    if (fs.existsSync(configPath)) {
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        oneDrivePath = configData.oneDrivePath;
    }

    // Validate the stored path
    if (!oneDrivePath || !fs.existsSync(oneDrivePath)) {
        console.warn("OneDrive path is invalid or missing:", oneDrivePath);

        const userResponse = await dialog.showOpenDialog({
            title: "Select Your OneDrive Folder",
            properties: ["openDirectory"],
            message: "Please select your OneDrive directory to configure the app.",
        });

        if (userResponse.canceled || !userResponse.filePaths.length) {
            throw new Error("OneDrive path selection was canceled.");
        }

        oneDrivePath = userResponse.filePaths[0];

        if (!fs.existsSync(oneDrivePath)) {
            console.error("Selected path does not exist:", oneDrivePath);
            throw new Error("Invalid OneDrive path selected.");
        }

        // Save the new path to the config
        const configData = { oneDrivePath };
        fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
    }

    console.log("Using OneDrive path:", oneDrivePath);
    return path.normalize(oneDrivePath); // Normalize for platform compatibility
}


function createWindow() {
    if (process.platform === 'darwin') {
        app.dock.setIcon(path.join(__dirname, 'assets/logo.png'));
    }
    if (process.platform === 'win32') {
        app.dock.setIcon(path.join(__dirname, 'assets','logo.ico'));
    }
    
    app.setName('Cliinica');

    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon:  path.join(process.resourcesPath, process.platform === 'darwin' ? 'assets/logo.png' : 'assets/logo.ico'),
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: false,
            webSecurity: false, // Disable web security for local resources 
        },
    });

    // win.webContents.openDevTools(); // Open DevTools
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    // Uncomment this line to open DevTools
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        // Dereference the window object (optional cleanup)
    });
}

async function loadActivePatientFlows() {
    try {
        const basePath = await getBasePath();
        const filePath = path.join(basePath, 'patient-flows.json');
        const fileContent = await promises.readFile(filePath, 'utf8');  // Correct usage of fs.promises.readFile
        return  JSON.parse(fileContent) 
    } catch (error) {
        console.error("Error loading JSON files:", error);
        throw error; // Rethrow error to handle it in calling code
    }
}

async function loadAllFlows() {
    try {       
        const basePath = await getBasePath();
        const flowsDirectory = path.join(basePath, 'flows');
        
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
    return await loadAllFlows(); // Fetch all JSON files
});

ipcMain.handle('load-active-patient-flows', async (event) => {
    return await loadActivePatientFlows(); // Fetch all JSON files
});
// Read the user profile from the JSON file


async function loadCsvData(fileName) {
    try {
        // Construct the file path using process.resourcesPath
        // const filePath = path.join(__dirname, `${fileName}.csv`);
        // const basePath = app.isPackaged
        // ? process.resourcesPath // Production mode
        // : __dirname; // Development mode

        const basePath = await getBasePath();

        const filePath = path.join(basePath, `${fileName}.csv`);


        // Debugging: Log the resolved file path
        console.log(`Resolved file path for ${fileName}: ${filePath}`);

        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            throw new Error(`File not found: ${filePath}`);
        }

        // Parse the CSV data into a structured format
        const rows = [];
        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csvParser())
                .on('data', (data) => rows.push(data))
                .on('end', () => resolve(rows))
                .on('error', (error) => reject(error));
        });
    } catch (error) {
        console.error(`Error loading CSV file "${fileName}":`, error);
        throw error;
    }
}

// IPC handlers for loading and saving CSV data
ipcMain.handle('load-csv', async (event, sheetName) => {
    // const filePath = filePaths.find(file => basename(file) === `${sheetName}.csv`);
    if (sheetName) {
        return await loadCsvData(sheetName);
    } else {
        throw new Error(`File for sheet "${sheetName}" not found.`);
    }
});

async function saveCsvFile(fileName, data) {
    try {
        const basePath = await getBasePath();

        const filePath = path.join(basePath, `${fileName}`);

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Data must be a non-empty array of objects.');
        }

        // Determine the CSV headers from the keys of the first object
        const headers = Object.keys(data[0]);

        // Parse the data into CSV format
        const csvContent = parse(data, { headers });


        // Write the CSV content to the file
        fs.writeFileSync(filePath, csvContent, 'utf8');
        console.log(`CSV file saved successfully to: ${filePath}`);
    } catch (error) {
        console.error(`Error saving CSV file to ${fileName}:`, error);
        throw error; // Rethrow error to allow the calling code to handle it
    }
}

ipcMain.on('save-csv', (event, filePath, data) => {
    saveCsvFile(filePath, data); // Save CSV data to file
});

const saveJSONFile = async (fileName, data) => {
  try {
    const basePath = await getBasePath();
    // Convert data to JSON string
    const jsonData = JSON.stringify(data, null, 2); // `null, 2` adds indentation for readability

    // Define the file path
    const filePath = path.join(basePath, `${fileName}`);
    // Write the JSON string to a file
    console.log("Writing to filepath", filePath)
    fs.writeFileSync(filePath, jsonData, "utf-8");

    console.log(`JSON saved successfully to ${filePath}`);
  } catch (error) {
    console.error("Error saving JSON:", error);
  }
};

ipcMain.on('save-json', (event, filename, data) => {
    console.log("saving json file")
    saveJSONFile(filename, data); // Save CSV data to file
});

const deleteFlowFile = async (flowName) => {
    try {
        console.log("Deleting flow file", flowName)
      // Define the directory containing the flow files
      const basePath = await getBasePath();

      const flowsDir = path.join(basePath, 'flows');
        
      console.log("Deleting flow file", flowsDir)
      // Construct the file name
      const fileName = `${flowName}_flow.json`;
  
      // Construct the full path to the file
      const filePath = path.join(flowsDir, fileName);
  
      // Check if the file exists
      if (fs.existsSync(filePath)) {
        // Delete the file
        fs.unlinkSync(filePath);
        console.log(`Successfully deleted: ${filePath}`);
      } else {
        console.error(`File not found: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error deleting file: ${error.message}`);
    }
};

ipcMain.on('delete-flow', (event, flowName) => {
    console.log("deleting flow file")
    deleteFlowFile(flowName); // Delete the flow file
});

  ipcMain.on('save-json', (event, filename, data) => {
    console.log("saving json file")
    deleteFlowFile(filename, data); // Save CSV data to file
});

const saveFlow = async (flow) => {
    try {
        if (!flow || !flow.title) {
            console.error('Error: Flow title is required.');
            return;
        }

        const basePath = await getBasePath();

        const filePath = path.join(basePath, 'flows', `${flow.title || 'untitled'}_flow.json`);

        // Ensure the 'flows' directory exists
        // if (!fs.existsSync(path.dirname(filePath))) {
        //     fs.mkdirSync(path.dirname(filePath));
        // }

        // Write the flow data to a JSON file
        fs.writeFileSync(filePath, JSON.stringify(flow, null, 2), 'utf8');
        console.log(`Flow saved successfully to ${filePath}`);
    } catch (error) {
        console.error('Error saving flow:', error);
    }
};


ipcMain.on('save-flow', (event, flow) => {
    saveFlow(flow);
    event.reply('flow-saved', 'Flow saved successfully');
});

// Ensure OneDrive path is set
async function ensureOneDrivePath() {
    const configPath = path.join(app.getPath('userData'), 'config.json');

    // Load existing config
    let oneDrivePath = null;
    if (fs.existsSync(configPath)) {
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        oneDrivePath = configData.oneDrivePath;
        oneDrivePath = path.resolve(oneDrivePath);

    }

    // If path is not found or invalid, prompt the user
    if (!oneDrivePath || !fs.existsSync(oneDrivePath)) {
        console.warn("Invalid or missing OneDrive path:", oneDrivePath);

        const userResponse = await dialog.showOpenDialog({
            title: "Select Your OneDrive Folder",
            properties: ["openDirectory"],
            message: "Please select your OneDrive directory to configure the app.",
        });

        if (userResponse.canceled || !userResponse.filePaths.length) {
            throw new Error("OneDrive path selection was canceled.");
        }

        oneDrivePath = userResponse.filePaths[0];

        // Validate the selected path
        if (!fs.existsSync(oneDrivePath)) {
            console.error("Selected path does not exist:", oneDrivePath);
            throw new Error("Invalid OneDrive path selected.");
        }

        // Save the new path to the config
        const configData = { oneDrivePath: path.normalize(oneDrivePath) }; // Normalize path
        fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
    }

    console.log("Final OneDrive path:", oneDrivePath);
    return path.normalize(oneDrivePath); // Normalize before returning
}


app.whenReady()
    .then(async () => {
        try {
            const oneDrivePath = await ensureOneDrivePath();
            console.log("OneDrive path successfully set:", oneDrivePath);
            // basePath = oneDrivePath;

            // Create the main window after OneDrive path is ready
            createWindow();
        } catch (err) {
            console.error('Error during OneDrive setup:', err);
            dialog.showErrorBox(
                "OneDrive Setup Error",
                err, // Display the error message
            );
            app.quit();
        }
    })
    .catch((err) => {
        console.error('Error during app initialization:', err);
    });

    
app.on('window-all-closed', async () => {

    // if (process.platform !== 'darwin') app.quit();
        // make backups of the patient-flows.json file
    const basePath = await getBasePath(); // Ensure basePath is resolved
    const backupPath = path.join(basePath, 'backups');
    const backupFileName = `patient-flows_backup.json`;
    const backupFileNamePatients = `patients_backup.csv`;

    const backupFilePath = path.join(backupPath, backupFileName);
    const backupFilePathPatients = path.join(backupPath, backupFileNamePatients);

    if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath);
    }
    fs.copyFileSync(path.join(basePath, 'patient-flows.json'), backupFilePath);
    fs.copyFileSync(path.join(basePath, 'patients.csv'), backupFilePathPatients);
    console.log(`Backup of patients.csv saved to: ${backupFilePathPatients}`);
    console.log(`Backup of patient-flows.json saved to: ${backupFilePath}`);
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
