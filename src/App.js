import React, { use, useEffect, useState } from 'react';
import './App.css';
import Overview from './pages/overview/Overview';
import Organization from './pages/organization/Organization';
import IntakeFlows from './pages/intakeFlows/IntakeFlows';
import { FaUser } from 'react-icons/fa';
import Login from './pages/login/Login';
import Onboarding from './onboarding/Onboarding';
import Navbar from './components/navbar/Navbar';
import Header from './components/header/Header'
import Settings from './onboarding/Settings';
const App = () => {
    
    const [activeTab, setActiveTab] = useState('Patients');
    const [userProfile, setUserProfile] = useState(null);
    const [organization, setOrganization] = useState([]);
    const [showUserInfo, setShowUserInfo] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    const [oneDrivePath, setOneDrivePath] = useState('');
    const [organizations, setOrganizations] = useState([]);
    const [patientHeaders, setPatientHeaders] = useState([]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const needOnboarding = async () => {
        try {
            // 1. Check OneDrive path
            const path = await window.electron.getOneDrivePath();
            if (!path) {
                console.log('No OneDrive path found.');
                return true;
            }
    
            // 2. Load CSV files
            const organizations = await window.electron.loadCsv('organization');
            const patients = await window.electron.loadCsv('patients');
    
            // 3. Organization checks:
            //    - Must have at least one member
            //    - At least one admin
            if (!organizations || organizations.length === 0) {
                console.log('No organization members found.');
                return true;
            }
            console.log("organizations", organizations);
            const hasAdmin = organizations.some((member) => member.isAdmin);
            if (!hasAdmin) {
                console.log('No admin user found in organization.');
                return true;
            }
    
    
    
          
    
            // If we passed all checks, no onboarding needed
            return false;
        } catch (error) {
            console.error('Error loading onboarding configuration:', error);
            // If there's any error or missing file, default to showing onboarding
            return true;
        }
    };
    
    useEffect(() => {
        const checkOnboarding = async () => {
            const onboarding = await needOnboarding();
            setShowOnboarding(onboarding);
        };

        checkOnboarding();
    }, []);

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


    if (showOnboarding) {
        return <Onboarding setShowOnboarding={setShowOnboarding}/>;
    }
    
    if (!userProfile) {
        return (
            <Login setUserProfile={(profile) => setUserProfile(profile)}/>
        )
    }

    
    return (
        <div className="app">
          <Header name={userProfile.firstName + " " + userProfile.lastName} />
          <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
            <Navbar selected={activeTab} onSelect={handleTabChange} userProfile={userProfile} setUserProfile={setUserProfile} />
            {activeTab === 'Patients' && <Overview userProfile={userProfile} />}
            {activeTab === 'Organization' && (
              <Organization userProfile={userProfile} setUpdatedOrganization={setOrganization} />
            )}
            {activeTab === 'Flows' && <IntakeFlows userProfile={userProfile} />}
            {activeTab === 'Settings' && <Settings />}
          </div>
        </div>
      );
};

export default App;
