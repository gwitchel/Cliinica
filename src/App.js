import React, { useEffect, useState } from 'react';
import './App.css';
import Overview from './pages/overview/Overview';
import Organization from './pages/organization/Organization';
import IntakeFlows from './pages/intakeFlows/IntakeFlows';
import { FaUser } from 'react-icons/fa';
import Login from './pages/login/Login';

const App = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [userProfile, setUserProfile] = useState(null);
    const [organization, setOrganization] = useState([]);
    const [showUserInfo, setShowUserInfo] = useState(false);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleUserIconClick = () => {
        setShowUserInfo(true);
        setTimeout(() => {
            setShowUserInfo(false);
        }, 3000);
    };

    const loadOrganization = async () => {
        try {
            const orgData = await window.electron.loadCsv('organization');
            setOrganization(orgData);
        } catch (error) {
            console.error('Error loading organization data:', error);
        }
    };

    const handleUserSelection = async (selectedUserId) => {
        const selectedUser = organization.find(user => user._id === selectedUserId);
        if (selectedUser) {
            try {
                await window.electron.saveJsonFile('user-profile.json', selectedUser);
                setUserProfile(selectedUser);
            } catch (error) {
                console.error('Error saving user profile:', error);
            }
        }
    };

    useEffect(() => {
        const initializeApp = async () => {
            try {
                await loadOrganization();
            } catch (error) {
                console.error('Error initializing the app:', error);
            }
        };

        initializeApp();
    }, []);

    if (!userProfile) {
        return (
            <Login setUserProfile={(profile) => setUserProfile(profile)}/>
        )
    }

    return (
        <div className="app">
            <div className="tabs-container">
                <div className="tabs">
                    <button
                        className={activeTab === 'overview' ? 'tab active' : 'tab'}
                        onClick={() => handleTabChange('overview')}
                    >
                        Patients
                    </button>
                    <button
                        className={activeTab === 'organization' ? 'tab active' : 'tab'}
                        onClick={() => handleTabChange('organization')}
                    >
                        Organization
                    </button>
                    <button
                        className={activeTab === 'intakeFlows' ? 'tab active' : 'tab'}
                        onClick={() => handleTabChange('intakeFlows')}
                    >
                        Flows
                    </button>
                    
                </div>
                <div
                    className="slider"
                    style={{
                        transform: `translateX(${['overview', 'organization', 'intakeFlows'].indexOf(activeTab) * 100}%)`,
                    }}
                ></div>
            </div>

            {activeTab === 'overview' && <Overview userProfile={userProfile}/>}
            {activeTab === 'organization' && <Organization userProfile={userProfile}/>}
            {activeTab === 'intakeFlows' && <IntakeFlows userProfile={userProfile}/>}

            <div className="user-icon-container" onClick={handleUserIconClick}>
                <div
                    className={`user-icon ${showUserInfo ? 'expanded' : ''}`}
                    title="User Profile"
                >
                    {showUserInfo && userProfile ? (
                        <h6>{`${userProfile.firstName} ${userProfile.lastName}`}</h6>
                    ) : (
                        <span> <FaUser /></span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
