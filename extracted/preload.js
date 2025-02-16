const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadCsv: (sheetName) => {
        console.log(`loadCsv called with sheetName: ${sheetName}`); // Log when loadCsv is called
        return ipcRenderer.invoke('load-csv', sheetName);
    },
    onCsvUpdated: (callback) => {
        console.log("Setting up onCsvUpdated listener");
        ipcRenderer.on('csv-updated', (event, updatedFileName) => {
            console.log(`csv-updated event received for file: ${updatedFileName}`);
            callback(updatedFileName);
        });
    },
    ensureOneDrivePath: () => {
        console.log("Ensuring OneDrive path...");
        return ipcRenderer.invoke('ensure-one-drive-path');
    },
    getOneDrivePath: () => {
        console.log("Getting OneDrive path...");
        return ipcRenderer.invoke('get-one-drive-path');
    },
    saveCsvFile: (filePath, data) => {
        console.log(`Saving CSV file to: ${filePath}`);
        ipcRenderer.send('save-csv', filePath, data);
    },
    saveJsonFile: (filePath, data) => {
        console.log(`Saving JSON file to: ${filePath}`);
        ipcRenderer.send('save-json', filePath, data);
    },
    deleteFlow: (filePath) => {
        console.log(`Deleting flow file at: ${filePath}`);
        ipcRenderer.send('delete-flow', filePath);
    },
    loadCsv: (sheetName) => ipcRenderer.invoke('load-csv', sheetName),
    loadActivePatientFlows: () => ipcRenderer.invoke('load-active-patient-flows'),
    loadAllJson: () => ipcRenderer.invoke('load-all-json'),
    saveFlow: (flow) => ipcRenderer.send('save-flow', flow), // Equivalent to ipcRenderer.send
    onFlowSaved: (callback) => ipcRenderer.once('flow-saved', callback) // Equivalent to ipcRenderer.once


});
