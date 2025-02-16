const { readCsvFile } = require('./readCsvFile');

async function loadCsvData(filePath) {
    try {
        const csvData = await readCsvFile(filePath); // Reads and parses CSV file

        // Ensure the data is in array format
        if (!Array.isArray(csvData) || csvData.length === 0) {
            throw new Error("CSV data is empty or not in expected format");
        }

        // Parse CSV rows into a table format
        const headers = Object.keys(csvData[0]);
        const rows = csvData.map(row => {
            const formattedRow = {};
            headers.forEach(header => {
                formattedRow[header] = row[header] || ''; // Fill missing cells with an empty string
            });
            return formattedRow;
        });

        return rows;
    } catch (error) {
        console.error("Error loading CSV data:", error);
        throw error; // Rethrow error to handle it in calling code
    }
}

module.exports = {loadCsvData};
