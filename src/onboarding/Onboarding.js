import React, { useState, useEffect } from 'react';
import Organization from '../pages/organization/Organization';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import OneDrivePathSetup from './OneDrivePathSetup'; // Import subcomponent

const Onboarding = ({ setShowOnboarding }) => {
    // ----- STATE -----
    const [activeTab, setActiveTab] = useState(1);
    const [oneDrivePath, setOneDrivePath] = useState('');
    const [organizations, setOrganizations] = useState([]);

    // ----- EFFECTS -----
    useEffect(() => {
        loadOrganizations();
    }, []);

    // ----- STEP 2: ORGANIZATION -----
    const loadOrganizations = async () => {
        try {
            const processedData = await window.electronAPI.loadCsv('organization');
            setOrganizations(processedData);
        } catch (error) {
            console.error('Error loading organizations data:', error);
        }
    };

    // ----- STEP COMPLETENESS -----
    const tabs = [
        {
            id: 1,
            label: 'OneDrive Path',
            isComplete: !!oneDrivePath,
        },
        {
            id: 2,
            label: 'Organization',
            isComplete: organizations.length > 0,
        }
    ];

    // Check if ALL steps are complete
    const allStepsComplete = tabs.every((tab) => tab.isComplete);

    // ----- RENDER -----
    const renderTabContent = () => {
        switch (activeTab) {
            case 1:
                return <OneDrivePathSetup oneDrivePath={oneDrivePath} setOneDrivePath={setOneDrivePath} />;
            case 2:
                return (
                    <div>
                        <h2>Step 2: Configure Organization</h2>
                        <Organization userProfile={{ isAdmin: true }} setUpdatedOrganization={setOrganizations} />
                    </div>
                );
            default:
                return <div>Select a tab</div>;
        }
    };

    const finishOnboarding = () => {
        setShowOnboarding(false);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            {/* HEADER WITH "ONBOARDING" TITLE AND FINISH BUTTON */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1>Onboarding</h1>
                {allStepsComplete && (
                    <button
                        onClick={finishOnboarding}
                        style={{
                            padding: '10px 16px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px',
                        }}
                    >
                        Finish Onboarding
                    </button>
                )}
            </div>

            {/* TAB BAR */}
            <div
                style={{
                    display: 'flex',
                    borderBottom: '1px solid #ccc',
                    marginBottom: '20px',
                    marginTop: '10px',
                }}
            >
                {tabs.map((tab) => {
                    const activeStyle = {
                        padding: '10px 20px',
                        cursor: 'pointer',
                        borderBottom: activeTab === tab.id ? '3px solid #007BFF' : 'none',
                        color: activeTab === tab.id ? '#007BFF' : '#333',
                        backgroundColor: '#f9f9f9',
                        display: 'flex',
                        alignItems: 'center',
                    };

                    return (
                        <div
                            key={tab.id}
                            style={activeStyle}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                            &nbsp;
                            {tab.isComplete ? (
                                <FaCheckCircle color="green" title="Completed" />
                            ) : (
                                <FaExclamationTriangle color="orange" title="Not complete" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* RENDER ACTIVE TAB CONTENT */}
            {renderTabContent()}
        </div>
    );
};

export default Onboarding;
