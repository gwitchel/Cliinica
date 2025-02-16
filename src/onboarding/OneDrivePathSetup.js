import React, { useState, useEffect } from 'react';
import './OneDrivePathSetup.css'
const OneDrivePathSetup = ({ oneDrivePath, setOneDrivePath }) => {
    useEffect(() => {
        fetchOneDrivePath();
    }, []);

    const fetchOneDrivePath = async () => {
        try {
            const path = await window.electronAPI.getOneDrivePath();
            setOneDrivePath(path);
        } catch (error) {
            console.error('Error fetching OneDrive path:', error);
        }
    };

    const configureOneDrivePath = async () => {
        console.log('Configuring OneDrive path...');
        try {
            const path = await window.electronAPI.ensureOneDrivePath();
            setOneDrivePath(path);
        } catch (error) {
            console.error('Error configuring OneDrive path:', error);
        }
    };

    return (
        <div>
            <div className='title'> Configure File Path</div>
            {oneDrivePath ? (
                <div className='current-path'>
                    <strong>Current File Path: </strong>
                    {oneDrivePath}
                </div>
            ) : (
                <div className='no-path'>No OneDrive path configured yet.</div>
            )}
            <button
                className='set-path-button'
                onClick={configureOneDrivePath}
            >
                {oneDrivePath ? 'Change OneDrive Path' : 'Configure OneDrive Path'}
            </button>
        </div>
    );
};

export default OneDrivePathSetup;
