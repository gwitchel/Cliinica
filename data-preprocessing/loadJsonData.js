const fs = require('fs').promises;
const path = require('path');

// Function to load JSON data from a file
async function loadJsonData(sheetName) {
    try {
        const flowsDirectory = path.join(__dirname, 'data-preprocessing', 'flows');
        
        // Get all files in the 'flows' directory
        const files = await fs.readdir(flowsDirectory);

        // Find the JSON file that matches the sheetName
        const file = files.find(file => file === `${sheetName}.json`);

        if (!file) {
            throw new Error(`File for sheet "${sheetName}" not found in the flows directory.`);
        }

        // Read the content of the JSON file
        const filePath = path.join(flowsDirectory, file);
        const fileContent = await fs.readFile(filePath, 'utf8');
        
        // Parse the content as JSON
        const jsonData = JSON.parse(fileContent);

        return jsonData; // Return the parsed JSON data
    } catch (error) {
        console.error("Error loading JSON data:", error);
        throw error; // Rethrow error to handle it in calling code
    }
}

module.exports = { loadJsonData };

