const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Expose the `loadUserProfile` function to the renderer process
contextBridge.exposeInMainWorld('electron', {
    loadUserProfile: () => {
        const userProfilePath = path.join(__dirname, 'user-profile.json');
        
        return new Promise((resolve, reject) => {
            fs.readFile(userProfilePath, 'utf8', (err, data) => {
                if (err) {
                    reject('Error reading user profile');
                } else {
                    resolve(JSON.parse(data)); // Return the parsed JSON
                }
            });
        });
    },
});
