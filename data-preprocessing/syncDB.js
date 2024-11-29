const { ipcMain } = require('electron');
const { join, basename } = require('path');
const { existsSync, statSync } = require('fs');
const { readCsvFile } = require('./readCsvFile');
const { saveCsvFile } = require('./saveCSV');
const path = require('path');

const OPENAI_API_KEY = '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';

async function fetchChatGPTResponse(rowData) {
    const { default: fetch } = await import('node-fetch'); // Dynamic import

    const prompt = `
        Extract the following information in JSON format as best as you can:
        - Age usually in the format of "35F/M" Age is a number
        - Gender usually in the format of "35F/M" Report gender as either Male, Female, or None
        - Occupation (if available)
        - Chief Complaint or One Liner (if available)
        - Symptoms (if available)
        - Treatments (with date if available). This should be an array of strings
        - MRI Date (if available) Otherwise None or True if you think it's been completed and just no date has been provided
        - EMG Date (if available) Otherwise None or True if you think it's been completed and just no date has been provided
        - Ultrasound Date (if available) Otherwise None or True if you think it's been completed and just no date has been provided
        - Additional Notes

        Row Data: "${JSON.stringify(rowData)}"

        Do not return ANYTHING other than the Json, such that it's viable to be run through the javascript 
        JSON.parse() function
    `;

    for (let attempt = 1; attempt <= 4; attempt++) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 150
                })
            });

            const data = await response.json();
            console.log("DATA", data.choices[0].message.content);
            return JSON.parse(data.choices[0].message.content); // Attempt JSON parsing

        } catch (error) {
            console.error(`Attempt ${attempt} - Error parsing JSON response:`, error);
            if (attempt === 4) {
                console.error('Failed to parse JSON after 4 attempts.');
                return null;
            }
        }
    }
}

async function syncCsvFiles() {
    console.log("Syncing CSV files...");
    const sourceFile = path.resolve(__dirname, '../Deidentified - referrals.csv');
    const targetFile = path.resolve(__dirname, '../referrals-legacy.csv');
    const processedFile = path.resolve(__dirname, '../processed-referrals.csv');

    const sourceData = await readCsvFile(sourceFile);
    const targetData = await readCsvFile(targetFile) || [];
    const processedData = await readCsvFile(processedFile) || [];

    const currentDateTime = new Date().toISOString();

    sourceData.forEach(sourceRow => {
        const legacyRow = targetData.find(row => row['MRN'] === sourceRow['MRN']);
        if (!legacyRow) {
            const newRow = { ...sourceRow, 'Date Added': currentDateTime, 'Changed Columns': 'All', 'Needs Processing': true };
            targetData.push(newRow);
        } else {
            let hasChanges = false;
            const changedColumns = [];
            Object.keys(sourceRow).forEach(column => {
                if (sourceRow[column] !== legacyRow[column]) {
                    hasChanges = true;
                    changedColumns.push(column);
                    legacyRow[column] = sourceRow[column];
                }
            });
            if (hasChanges) {
                legacyRow['Date Added'] = currentDateTime;
                legacyRow['Changed Columns'] = changedColumns.join(', ');
                legacyRow['Needs Processing'] = true;
            }
        }
    });

    try {
        await saveCsvFile(targetFile, targetData);
    } catch (error) {
        console.error("Error saving referrals-legacy.csv:", error);
        return;
    }

    // for (let legacyRow of targetData) {
    //     if (legacyRow['Needs Processing'] === true) {
    //         console.log("Processing legacy row", legacyRow);
    //         const originalMRN = legacyRow['MRN'];
    //         const sourceRow = sourceData.find(row => row['MRN'] === originalMRN);

    //         if (sourceRow) {
    //             console.log("Source row", sourceRow);
    //             const responseData = await fetchChatGPTResponse(sourceRow);
    //             console.log("Response data", responseData);
    //             if (responseData) {
    //                 const processedEntry = {
    //                     ...responseData,
    //                     'MRN': originalMRN,
    //                     'Date Processed': new Date().toISOString()
    //                 };
    //                 processedData.push(processedEntry);
    //                 legacyRow['Needs Processing'] = false;
    //                 legacyRow['Date Processed'] = new Date().toISOString();
    //             }
    //         }
    //     }
    // }

    // try {
    //     await saveCsvFile(processedFile, processedData);
    //     console.log("Processed data saved to processed-referrals.csv");
    // } catch (error) {
    //     console.error("Error saving processed-referrals.csv:", error);
    //     return;
    // }

    // try {
    //     await saveCsvFile(targetFile, targetData);
    //     console.log("Processed data saved to referrals-legacy.csv");
    // } catch (error) {
    //     console.error("Error re-saving referrals-legacy.csv:", error);
    // }

    console.log("Sync complete with processed data.");
}

module.exports = { syncCsvFiles };
