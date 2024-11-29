const fs = require('fs');
const path = require('path');

// Function to save the flow as a JSON file
const saveFlow = (flow) => {
    try {
        if (!flow || !flow.title) {
            console.error('Error: Flow title is required.');
            return;
        }

        const filePath = path.join(__dirname, 'flows', `${flow.title || 'untitled'}_flow.json`);

        // Ensure the 'flows' directory exists
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath));
        }

        // Write the flow data to a JSON file
        fs.writeFileSync(filePath, JSON.stringify(flow, null, 2), 'utf8');
        console.log(`Flow saved successfully to ${filePath}`);
    } catch (error) {
        console.error('Error saving flow:', error);
    }
};

module.exports = { saveFlow };