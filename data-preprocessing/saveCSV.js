const { parse } = require('json2csv');
const fs = require('fs');
const path = require('path');

const saveCsvFile = (filePath, data) => {
    console.log(`Saving CSV file to ${filePath}...`);

    if (!data || data.length === 0) {
        console.error('Error saving CSV file: Data should not be empty');
        return;
    }

    try {
        // Define the fields that should appear in the CSV
        const fields = Object.keys(data[0]);

        // Parse the data into CSV format
        const csv = parse(data, { fields });

        // Write the CSV data to the file
        fs.writeFileSync(filePath, csv, 'utf8');
        console.log(`CSV file saved successfully to ${filePath}`);
    } catch (error) {
        console.error('Error saving CSV file:', error);
    }
};

module.exports = { saveCsvFile };
