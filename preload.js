const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    runPython: (scriptPath, ...args) => ipcRenderer.invoke('run-python', scriptPath, ...args),
    loadCsv: () => ipcRenderer.invoke('load-csv'),
    onCsvUpdate: (callback) => ipcRenderer.on('csv-updated', callback),
    saveCsv: (updatedData) => ipcRenderer.invoke('save-csv', updatedData),
});
