const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

// Function to get all saved flows from the 'flows' directory
const getFlows  = async () => {
    const referrals = await window.electron.loadCsv('referrals-legacy');
};


