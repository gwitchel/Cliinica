import React, { useState } from 'react';
import './App.css';
import Overview from './pages/overview/Overview';
import Organization from './pages/organization/Organization';
import IntakeFlows from './pages/intakeFlows/IntakeFlows';
import Bulletin from './pages/bulletin/bulletin';

const App = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    return (
        <div className="app">
            <div className="tabs">
                <button
                    className={activeTab === 'overview' ? 'active' : ''}
                    onClick={() => handleTabChange('overview')}
                >
                    Overview
                </button>
                <button
                    className={activeTab === 'organization' ? 'active' : ''}
                    onClick={() => handleTabChange('organization')}
                >
                    Organization
                </button>
                <button
                    className={activeTab === 'intakeFlows' ? 'active' : ''}
                    onClick={() => handleTabChange('intakeFlows')}
                >
                    My Intake Flows
                </button>
                <button
                    className={activeTab === 'bulletin' ? 'active' : ''}
                    onClick={() => handleTabChange('bulletin')}
                >
                    Bulletin
                </button>
            </div>

            {activeTab === 'overview' && <Overview />}
            {activeTab === 'organization' && <Organization />}
            {activeTab === 'intakeFlows' && <IntakeFlows />}
            {activeTab === 'bulletin' && <Bulletin />}
        </div>
    );
};

export default App;
