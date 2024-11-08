import React, { useEffect, useState } from 'react';
import { useTable } from 'react-table';

const App = () => {
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);

    // Function to load data
    const loadData = () => {
        window.electronAPI.loadCsv().then((csvData) => {
            setData(csvData);

            if (csvData.length > 0) {
                const headers = Object.keys(csvData[0]);
                const tableColumns = headers.map((header) => ({
                    Header: header,
                    accessor: header,
                }));
                setColumns(tableColumns);
                console.log("COLUMNS", tableColumns);
            }
        }).catch((error) => console.error('Error loading CSV:', error));
    };

    useEffect(() => {
        // Initial data load
        loadData();

        // Listen for the csv-updated event to reload data
        window.electronAPI.onCsvUpdate(() => {
            console.log('CSV file updated, reloading data...');
            loadData();
        });
    }, []);


    return (
        <div>
            <h1>CSV Data Viewer</h1>
        </div>
    );
};

export default App;
