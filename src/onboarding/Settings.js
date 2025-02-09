import React, {useState} from 'react';
import OneDrivePathSetup from './OneDrivePathSetup'; // Import subcomponent
import PatientHeaders from './PatientHeaders';
import "./Settings.css";

const Settings = () => {
    const [oneDrivePath, setOneDrivePath] = useState('');
    
    return (
        <div className = "settings-container">
            <div className='settings-subcontainer'>
                <OneDrivePathSetup oneDrivePath={oneDrivePath} setOneDrivePath={setOneDrivePath} />
            </div>
            <div className='settings-subcontainer'>
                <PatientHeaders />
            </div>
        </div>
    );
};

export default Settings;