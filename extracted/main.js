const fs = require('fs');
const promises = require('fs').promises;
const path = require('path');
const { parse } = require('json2csv');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { join, basename } = require('path');
const csvParser = require('csv-parser');
const os = require('os'); // For detecting user-specific paths
const { get } = require('http');


process.on('uncaughtException', (error) => {
  const errorLogPath = path.join(app.getPath('userData'), 'error.log');
  fs.appendFileSync(errorLogPath, `${new Date().toISOString()} - Uncaught Exception: ${error.stack || error}\n`);
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  const errorLogPath = path.join(app.getPath('userData'), 'error.log');
  fs.appendFileSync(errorLogPath, `${new Date().toISOString()} - Unhandled Rejection: ${reason}\n`);
  console.error('Unhandled Rejection:', reason);
});

async function getBasePath() {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    console.log("Config path:", configPath);
    let oneDrivePath = null;

    // Check if the config file exists
    if (fs.existsSync(configPath)) {
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        oneDrivePath = configData.oneDrivePath;
    } else {
        oneDrivePath = "";
    }

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
        width: 1605,
        height: 980,
        icon:  path.join(process.resourcesPath, process.platform === 'darwin' ? 'assets/logo.png' : 'assets/logo.ico'),
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            enableRemoteModule: false,
            webSecurity: true, // Disable web security for local resources 
        },
    });

    // win.webContents.openDevTools(); // Open DevTools
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    // Uncomment this line to open DevTools
    // mainWindow.webContents.openDevTools ();

    mainWindow.on('closed', () => {
        // Dereference the window object (optional cleanup)
    });
}

async function loadActivePatientFlows() {
  try {
      const basePath = await getBasePath();
      const filePath = path.join(basePath, 'patient-flows.json');

      // Ensure the file exists before reading it
      if (!fs.existsSync(filePath)) {
          console.warn("patient-flows.json not found. Creating a new one.");
          await promises.writeFile(filePath, JSON.stringify({}), 'utf8'); // Create empty JSON
      }

      // Read and return the JSON content
      const fileContent = await promises.readFile(filePath, 'utf8');
      return JSON.parse(fileContent);
  } catch (error) {
      console.error("Error loading JSON files:", error);
      throw error; // Rethrow error to handle it in calling code
  }
}

async function loadAllFlows() {
    try {       
        const basePath = await getBasePath();
        const flowsDirectory = path.join(basePath, 'flows');
        try {
          await fs.access(flowsDirectory);
        } catch (err) {
            await fs.promises.mkdir(flowsDirectory, { recursive: true });            // Directory doesn't exist, create it
        }

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
      const basePath = await getBasePath();
      const filePath = path.join(basePath, `${fileName}.csv`);
  
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
  

      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        return [];
      }
  
      return new Promise((resolve, reject) => {
        const rows = [];
        let firstHeader = null;
        let headerList = null;
  
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('headers', (headers) => {
            if (headers.length) {
              firstHeader = headers[0];
              headerList = headers;
            }
          })
          .on('data', (row) => rows.push(row))
          .on('end', () => {
            console.log("HEADERSSSSSSSS", firstHeader)
            console.log("ROWS", rows)
            if (rows.length === 0 && firstHeader) {
              // Return empty object with the headers as keys
              let emptyObj = {};
              headerList.forEach(h => emptyObj[h] = '');
              console.log("RESOLVING EMPTY", emptyObj)
              resolve([emptyObj]);
            } else {
              resolve(rows);
            }
          })
          .on('error', (err) => reject(err));
      });
    } catch (error) {
      console.error(`Error loading CSV file "${fileName}":`, error);
      throw error;
    }
  }
  
  


// IPC handlers for loading and saving CSV data

ipcMain.handle('load-csv', async (event, sheetName) => {
    if (!sheetName) {
        throw new Error(`Sheet name is required.`);
    }

    const basePath = await getBasePath();
    const filePath = path.join(basePath, `${sheetName}.csv`);
    
    if (!fs.existsSync(filePath)) {
        // If the file doesn't exist, create it with default headers (or leave empty if preferred)
        const basePath = await getBasePath();

        const filePath = path.join(basePath, `${sheetName}.csv`);
        fs.writeFileSync(filePath, '', 'utf8');
    }

    return await loadCsvData(sheetName);
});

async function saveCsvFile(fileName, data) {
    try {
      const basePath = await getBasePath(); // Custom function that resolves your desired base path
      const filePath = path.join(basePath, fileName);
  
      if (!Array.isArray(data)) {
        throw new Error('Data must be an array.');
      }
  
      // Check whether the file already exists
      const fileExists = fs.existsSync(filePath);
      let csvContent = '';
  
      if (!fileExists) {
        // If the CSV does not exist, create it with the first line of data being the keys
        if (data.length === 0 || (data.length === 1 && Object.keys(data[0]).length === 0)) {
          // If empty or only one empty object, we can’t guess the keys from data
          // Either create an empty file or define some default headers:
          csvContent = 'MRN,Patient Name,Date Added\n';
        } else {
          // We have data; get headers from the first object
          const headers = Object.keys(data[0]);
          // Generate CSV with these headers
          csvContent = parse(data, { fields: headers });
        }
      } else {
        // If file already exists, use your original overwrite logic
        // 1) Check if data is an array of strings (treat them as headers)
        if (Array.isArray(data) && data.every(item => typeof item === 'string')) {
          // Write a single header row from the string array
          console.log("AERRAY DATA", data)
          csvContent = data.join(',') + '\n';
        }
        // 2) Check if data is empty or has a single empty object
        else if (data.length === 0 || (data.length === 1 && Object.keys(data[0]).length === 0)) {
          const headers = data.length === 1 ? Object.keys(data[0]) : [];
          csvContent = headers.join(',') + '\n';
        }
        // 3) Otherwise assume data is an array of objects and use JSON-to-CSV parsing
        else {
          const headers = Object.keys(data[0]);
          csvContent = parse(data, { fields: headers });
        }
      }
      
  
      // Write the CSV content to the file
      fs.writeFileSync(filePath, csvContent, 'utf8');
      console.log(`CSV file saved successfully to: ${filePath}`);
    } catch (error) {
      console.error(`Error saving CSV file to ${fileName}:`, error);
      throw error; // Rethrow so calling code can handle it
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


ipcMain.handle('ensure-one-drive-path', async () => {
    console.log("setting one drive path");
    return await ensureOneDrivePath();
});

// Ensure OneDrive path is set
async function ensureOneDrivePath() {
    try {
        // Path to the configuration file
        const cp = path.join(app.getPath('userData'), 'config.json');

        // Show a dialog to select the OneDrive folder
        const userResponse = await dialog.showOpenDialog({
            title: "Select Your OneDrive Folder",
            properties: ["openDirectory"],
            message: "Please select your OneDrive directory to configure the app.",
        });

        if (userResponse.canceled || !userResponse.filePaths.length) {
            console.warn("User canceled the OneDrive folder selection.");
            return null;
        }

        const selectedPath = userResponse.filePaths[0];

        // Check if the selected path exists
        if (!fs.existsSync(selectedPath)) {
            console.error("Selected path does not exist:", selectedPath);
            throw new Error("Invalid OneDrive path selected.");
        }

        // Normalize the path for consistency across platforms
        const normalizedPath = path.normalize(selectedPath);

        // Save the OneDrive path to the config file (overwrite existing file)
        const configData = { oneDrivePath: normalizedPath };
        fs.writeFileSync(cp, JSON.stringify(configData, null, 2), 'utf8');

        console.log("OneDrive path configured successfully:", normalizedPath);

        // Return the normalized path
        return normalizedPath;
    } catch (error) {
        console.error("Error ensuring OneDrive path:", error);
        throw error; // Rethrow the error for further handling
    }
}


ipcMain.handle('get-one-drive-path', async () => {
    console.log("getting one drive path");
    const configPath = path.join(app.getPath('userData'), 'config.json');
    console.log("Config path:", configPath);
    
    let oneDrivePath = null;
    if (fs.existsSync(configPath)) {
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        oneDrivePath = configData.oneDrivePath;
    } else {
        return null;
    }

    return path.normalize(oneDrivePath); // Normalize for platform compatibility

});


app.whenReady()
    .then(async () => {
        try {
            // const oneDrivePath = await ensureOneDrivePath();
            // console.log("OneDrive path successfully set:", oneDrivePath);
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
        const basePath = await getBasePath();
        const backupPath = path.join(basePath, 'backups');
        const patientFlowsPath = path.join(basePath, 'patient-flows'); // Directory now
        const patientsCsvPath = path.join(basePath, 'patients.csv');
    
        const backupFilePathPatients = path.join(backupPath, 'patients_backup.csv');
        const backupDirPath = path.join(backupPath, 'patient-flows_backup'); // Directory backup
    
        // Ensure the backup directory exists
        if (!fs.existsSync(backupPath)) {
            fs.mkdirSync(backupPath, { recursive: true });
        }
    
        // Ensure patient-flows is a directory and copy it recursively
        if (fs.existsSync(patientFlowsPath) && fs.statSync(patientFlowsPath).isDirectory()) {
            fs.cpSync(patientFlowsPath, backupDirPath, { recursive: true });
            console.log(`Backup of patient-flows directory saved to: ${backupDirPath}`);
        } else {
            console.warn(`Warning: patient-flows directory not found. Skipping backup.`);
        }
    
        // Ensure patients.csv exists and is a file
        if (fs.existsSync(patientsCsvPath) && fs.statSync(patientsCsvPath).isFile()) {
            fs.copyFileSync(patientsCsvPath, backupFilePathPatients);
            console.log(`Backup of patients.csv saved to: ${backupFilePathPatients}`);
        } else {
            console.warn(`Warning: patients.csv not found. Creating a new one.`);
            fs.writeFileSync(patientsCsvPath, 'MRN,Patient Name\n', 'utf8');
        }
    
        app.quit();
    });
    

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
