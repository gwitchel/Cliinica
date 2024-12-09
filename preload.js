const { contextBridge, ipcRenderer } = require('electron');

window.electron = {
    loadCsv: (sheetName) => {
        console.log(`loadCsv called with sheetName: ${sheetName}`); // Log when loadCsv is called
        return ipcRenderer.invoke('load-csv', sheetName);
    },
    onCsvUpdated: (callback) => {
        console.log("Setting up onCsvUpdated listener");
        ipcRenderer.on('csv-updated', (event, updatedFileName) => {
            console.log(`csv-updated event received for file: ${updatedFileName}`);
            callback(event, updatedFileName);
        });
    },

    saveCsvFile: (filePath, data) => ipcRenderer.send('save-csv', filePath, data),
    saveJsonFile: (filePath, data)=> ipcRenderer.send('save-json', filePath, data),
    deleteFlow: (filePath) => ipcRenderer.send('delete-flow', filePath),

};
