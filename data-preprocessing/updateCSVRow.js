const { createReadStream } = require('fs');
const csv = require('csv-parser');
const { format } = require('fast-csv');


async function updateCSVRow( fileName, MRN, updatedColumns) {
    // Load the processed-referrals.csv using Electron's loadCsv API
    const userProfile = await window.electron.loadUserProfile();
    
    window.electron.loadCsv(fileName).then((data) => {
        // Clean the headers by trimming whitespace and ensuring they're consistent
        const headers = Array.isArray(data[0]) ? data[0].map(header => header.trim()) : Object.keys(data[0]).map(header => header.trim());
        
        // Get the rows (after the header)
        const rows = Array.isArray(data[0]) ? data.slice(1) : data;
        let found = false;

        // Iterate through each row and update the matching MRN
        const updatedRows = rows.map((row) => {
            // Get the MRN column value (either from an object or an array)
            const currentMRN = Array.isArray(row) ? row[headers.indexOf('MRN')] : row.MRN;

            // If the MRN matches, update the row with the new column values
            if (currentMRN === MRN) {
                found = true;
                // Update the columns with the new values
                Object.entries(updatedColumns).forEach(([column, newValue]) => {
                    const columnIndex = headers.indexOf(column.trim()); // Trim the column to ensure consistency
                    if (columnIndex !== -1) {

                        if (Array.isArray(row)) {
                            if (row[columnIndex] !== newValue) {
                                // Update the changelog if the file is 
                                if (fileName === 'patients') updateChangelog(new Date().toISOString(), MRN, column, newValue, row[columnIndex], userProfile._id);
                                row[columnIndex] = newValue; // Update array row by index

                            }
                        } else {
                            if (row[column] !== newValue) {
                                // Update the changelog if the file is 
                                if (fileName === 'patients') updateChangelog(new Date().toISOString(), MRN, column, newValue, row[column], userProfile._id);
                                row[column] = newValue; // Update object row by column name
                            }
                        }
                        
                    }
                });
            }
            return row;
        });

        // If no matching MRN is found, print an error
        if (!found) {
            // console.error(`No matching MRN found for ${MRN}`);
            // if not found add a new row
            const newRow = {};
            headers.forEach((header) => {
                newRow[header] = '';
            });
            newRow['MRN'] = MRN;
            Object.entries(updatedColumns).forEach(([column, newValue]) => {
                newRow[column] = newValue;
            });
            updatedRows.push(newRow);
            console.log('New row added:', newRow);
        }

        console.log('Updated rows:', [...updatedRows]);

        // Save the updated rows back to the CSV file using the existing saveCsvFile function
        window.electron.saveCsvFile(`${fileName}.csv`, [...updatedRows]);
        console.log('Referral updated successfully');
    }).catch((err) => {
        console.error('Error loading CSV file:', err);
    });

}

async function deleteCSVRow( fileName, MRN) {
    window.electron.loadCsv(fileName).then((data) => {
        // Clean the headers by trimming whitespace and ensuring they're consistent
        const headers = Array.isArray(data[0]) ? data[0].map(header => header.trim()) : Object.keys(data[0]).map(header => header.trim());
        
        // Get the rows (after the header)
        const rows = Array.isArray(data[0]) ? data.slice(1) : data;
        
        // Iterate through each row and update the matching MRN
        const updatedRows = rows.filter((row) => {
            // Get the MRN column value (either from an object or an array)
            const currentMRN = Array.isArray(row) ? row[headers.indexOf('MRN')] : row.MRN;

            // If the MRN matches, update the row with the new column values
            if (currentMRN === MRN) {
                return false;
            }
            return true;
        });


        // Save the updated rows back to the CSV file using the existing saveCsvFile function
        window.electron.saveCsvFile(`${fileName}.csv`, [...updatedRows]);
        console.log('Referral updated successfully');
    }).catch((err) => {
        console.error('Error loading CSV file:', err);
    });

}


async function updateChangelog( date, MRN, field, newValue, oldValue, changed_by) {
    // Load the processed-referrals.csv using Electron's loadCsv API
    const changeLog = await window.electron.loadCsv('changelog');

    const change = {
        'Date': date,
        'MRN': MRN,
        'Field': field,
        'Old Value': oldValue,
        'New Value': newValue,
        'Changed By': changed_by,
    };

    changeLog.push(change);

    window.electron.saveCsvFile('changelog.csv', changeLog);
    console.log('Changelog updated successfully');
}

module.exports = { updateCSVRow, deleteCSVRow };