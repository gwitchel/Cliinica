const { createReadStream } = require('fs');
const csv = require('csv-parser');
const { format } = require('fast-csv');


// Function to read CSV file and return data, handling empty files
function readCsvFile(filePath) {
    const results = [];
    return new Promise((resolve, reject) => {
        const stream = createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                resolve(results.length ? results : []);  // Return an empty array if no data
            })
            .on('error', (error) => reject(error));
    });
}

module.exports = { readCsvFile };