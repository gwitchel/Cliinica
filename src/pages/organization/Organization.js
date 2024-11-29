import React, {useState, useEffect} from 'react';
import './Organization.css';
const Organization = () => {
    const [organizations, setOrganizations] = useState([]);

    useEffect(() => {
        const loadOrganizations = async () => {
            try {
                const processedData = await window.electron.loadCsv('organization');
                setOrganizations(processedData);
            } catch (error) {
                console.error('Error loading organizations data:', error);
            }
        };

        console.log('Loading organizations...');
        loadOrganizations();
        
    }, []);

    return (
        <div>
            <h1>Organization Page</h1>
            <div class="org-cards">
            {organizations.length ? (organizations.map((organization, index) => (
                <div key={index} class="org-card">
                    <h2>{organization['firstName']} {organization['lastName']}</h2>
                    <p>{organization['role']}</p>
                </div>
            ))) : 'Loading organizations...'}
            </div>
        </div>
    );
};

export default Organization;