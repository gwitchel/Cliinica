import React, { useState, useEffect } from 'react';
import './PatientHeaders.css';
import { FaTrash } from 'react-icons/fa'; // FontAwesome icons

const PatientHeaders = () => {
    const [headers, setHeaders] = useState([]);
    const [editedHeaders, setEditedHeaders] = useState([]); // Stores edits separately
    const [showSaveModal, setShowSaveModal] = useState(false); // Save confirmation modal

    useEffect(() => {
        loadHeaders();
    }, []);

    const loadHeaders = async () => {
        try {
            const data = await window.electron.loadCsv('patients');
            if (data && data.length > 0) {
                const firstRow = data[0];
                const keys = Object.keys(firstRow);
                setHeaders(keys);
                setEditedHeaders([...keys]); // Initialize editable state
            }
        } catch (error) {
            console.error('Error loading Patients.csv:', error);
        }
    };

    const isLockedHeader = (header) => {
        const lower = header.toLowerCase();
        return lower === 'mrn' || lower === 'patient name';
    };

    const handleHeaderChange = (index, newHeader) => {
        const updatedHeaders = [...editedHeaders];

        if (!newHeader.trim()) {
            alert('Error: Header name cannot be empty.');
            return;
        }

        if (editedHeaders.includes(newHeader) && editedHeaders[index] !== newHeader) {
            alert('Error: Duplicate headers are not allowed.');
            return;
        }

        updatedHeaders[index] = newHeader;
        setEditedHeaders(updatedHeaders);
    };

    const handleAddHeader = () => {
        if (editedHeaders.includes('')) {
            alert('Error: Cannot add an empty field.');
            return;
        }
        setEditedHeaders([...editedHeaders, '']);
    };

    const handleDeleteHeader = (index) => {
        setEditedHeaders((prevHeaders) => prevHeaders.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (JSON.stringify(headers) !== JSON.stringify(editedHeaders)) {
            setShowSaveModal(true); // Show save confirmation modal if changes exist
        } else {
            alert('No changes detected.');
        }
    };

    const confirmSave = async () => {
        setShowSaveModal(false);

        if (editedHeaders.some(header => !header.trim())) {
            alert('Error: Cannot save empty header names.');
            return;
        }

        try {
            const data = await window.electron.loadCsv('patients');
            if (data && data.length > 0) {
                const originalHeaders = Object.keys(data[0]);

                const updatedData = data.map((row) => {
                    const newRow = {};
                    editedHeaders.forEach((headerName, i) => {
                        if (i < originalHeaders.length) {
                            const oldKey = originalHeaders[i];
                            newRow[headerName] = row[oldKey];
                        } else {
                            newRow[headerName] = '';
                        }
                    });
                    return newRow;
                });

                await window.electron.saveCsvFile('patients.csv', updatedData);
                setHeaders([...editedHeaders]); // Update headers only after saving
                // alert('Success: Headers updated successfully!');
            }
        } catch (err) {
            console.error('Error saving updated headers:', err);
        }
    };

    return (
        <div className="patient-container">
            <h2>Patient Headers</h2>

            {headers.length === 0 ? (
                <p>No headers found in Patients.csv.</p>
            ) : (
                <>
                    <p>Edit or remove headers below (except “MRN” and “Patient Name”).</p>
                    {editedHeaders.map((header, index) => {
                        const locked = isLockedHeader(header);
                        return (
                            <div key={index} className="patient-header-wrapper">
                                <input
                                    type="text"
                                    value={header}
                                    disabled={locked}
                                    onChange={(e) => handleHeaderChange(index, e.target.value)}
                                    className="patient-input"
                                />
                                {!locked && (
                                    <div
                                        onClick={() => handleDeleteHeader(index)}
                                        className="patient-button delete"
                                    >
                                        <FaTrash style={{ color: '#fff', width: 24, height: 24 }} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <button onClick={handleAddHeader} className="patient-button add">
                        Add Header
                    </button>
                    <button onClick={handleSave} className="patient-button save">
                        Save
                    </button>
                </>
            )}

            {showSaveModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <p>⚠️ You have unsaved changes. Are you sure you want to save?</p>
                        <div className="modal-buttons">
                            <button onClick={confirmSave} className="patient-button add">
                                Confirm
                            </button>
                            <button onClick={() => setShowSaveModal(false)} className="patient-button add">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientHeaders;
