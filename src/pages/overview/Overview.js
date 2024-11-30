import React, { useEffect, useState } from 'react';
import './Overview.css';
import ReferralCard from '../../components/ReferralCard';
import BigReferralCard from '../../components/BigReferralCard';
const { updateCSVRow } = require('../../../data-preprocessing/updateCSVRow');
const { getRecentReferralChanges } = require('../../../queries/getChangelogAfterDate');
const { getNeedsAttention } = require('../../../queries/getNeedsAttention');
// import { FaRegWindowClose } from 'react-icons/fa'; // FontAwesome icons
import {FaPlus, FaSearch, FaUpload, FaCog} from 'react-icons/fa'
import { FaArrowRotateLeft } from "react-icons/fa6";
import Papa from 'papaparse';
const fs = require('fs');
const path = require('path');

const Overview = () => {
    const [referrals, setReferrals] = useState([]);
    const [filteredReferrals, setFilteredReferrals] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [needsAttentionReferrals, setNeedsAttentionReferrals] = useState([]);
    const [showOnboarding, setShowOnboarding] = useState(false);
    
    const loadData = async () => {
        try {
            const processedData = await window.electron.loadCsv('patients');
            setReferrals(processedData);
            setFilteredReferrals(processedData);
            getNeedsAttention2()
        } catch (error) {
            console.warn('No Referrals Data', error);
            setShowOnboarding(true);

        }
        try {
            const userProfile = await window.electron.loadUserProfile();
            setUserProfile(userProfile);
          
        } catch (error) {
            console.error('Error loading referrals data:', error);
        }
    };

    const getNeedsAttention2 = async () => {
        try {
            const needsAttention = await getNeedsAttention();
            setNeedsAttentionReferrals(needsAttention);
        } catch (error) {
            console.error('Error loading needs attention referrals:', error);
        }
    };

    // recently changed and needs attention
    useEffect(() => {
        if(!showOnboarding){
            loadData();
        }
    }, [showOnboarding]);


    const handleAddNewPatient = () => {
        const newPatient = { 'Patient Name': '', 'MRN': '' };

        // Add empty patient to state
        const updatedReferrals = [...referrals, newPatient];
        setReferrals(updatedReferrals);
        setFilteredReferrals(updatedReferrals);

        // Select and expand the new patient for editing
        setSelectedReferral(newPatient);
    };

    const handleSearch = (event) => {
        const query = event.target.value.toLowerCase();
        setSearchQuery(query);

        setFilteredReferrals(
            referrals.filter(referral => {
                const patientName = referral['Patient Name']?.toLowerCase() || '';
                const mrn = referral['MRN']?.toLowerCase() || '';
                return patientName.includes(query) || mrn.includes(query);
            })
        );
    };

    // If patients file doesn't exist show onboarding options. 

    const handleFileUpload = async (event) => {
        const generateRandomMRN = () => {
            return Math.floor(10 ** 17 + Math.random() * 9 * 10 ** 17).toString(); // 18-digit random number
        };
        const file = event.target.files[0];
        if (file) {
            console.log(`File uploaded: ${file.name}`);
    
            // Parse the CSV file
            Papa.parse(file, {
                header: true, // Extract headers
                skipEmptyLines: true, // Ignore empty lines
                complete: (result) => {
                    let data = result.data;
                    const headers = result.meta.fields;
    
                    if (!data || data.length === 0) {
                        console.error('Uploaded file is empty or contains no valid rows.');
                        return;
                    }
    
                    console.log('Original Headers:', headers);
    
                    // Ensure MRN column exists
                    if (!headers.includes('MRN')) {
                        headers.push('MRN');
                    }
    
                    // Ensure each row has an MRN and a name
                    data = data.map(row => {
                        if (!row.MRN || row.MRN.trim() === '') {
                            row.MRN = generateRandomMRN();
                        }
                        return row;
                    });
    
                    console.log('Processed Data:', data);
    
                    // Save the processed data as patients.csv
                    const filePath = 'patients.csv'; // Adjust file path as needed
                    window.electron.saveCsvFile(filePath, data);
    
                    // Hide onboarding after upload and processing
                    setShowOnboarding(false);
                },
                error: (error) => {
                    console.error('Error parsing CSV file:', error);
                }
            });
        } else {
            console.error('No file selected.');
        }
    };

    if (showOnboarding) {
        return ( 
            <div className="app-container">
                <div className="search-controls">
                    <h1>
                        {userProfile
                            ? `Hello, ${userProfile.firstName} ${userProfile.lastName}`
                            : 'Loading user profile...'}
                    </h1>
                </div>
                <p>
                    Looks like you don't have any patients in the system. You can change this by uploading your existing referral CSV or by defining custom headers under settings.
                    IMPORTANT: please make sure your CSV has an all caps column called "MRN" which is the unique identifier for each patient. It doesn't have to be their actual MRN 
                    but it should be unique to each patient. If this isn't included we'll assign patients random unique MRNs as identifiers.
                </p>
                <label className="file-upload-btn">
                    <FaUpload /> Upload My Referrals File
                    <input
                        type="file"
                        accept=".csv"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                    />
                </label>
                <button onClick={() => {}} className="refresh-btn">
                    <FaCog /> Define Custom Headers
                </button>
            </div>
        )

    }
    return (
        <div className="app-container">
            <div className='search-controls'>
                <h1>{userProfile ? `Hello, ${userProfile.firstName} ${userProfile.lastName}` : 'Loading user profile...'}</h1>
                <div className='search-controls-right'>
                <button onClick={handleAddNewPatient} className="add-patient-btn"><FaPlus/></button>
                <button onClick={loadData} className="refresh-btn"><FaArrowRotateLeft/></button>
                <button onClick={()=>{}} className="refresh-btn"><FaUpload/></button>

                <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={handleSearch}
                    className="search-bar"
                />
                </div>
            </div> 
            <div>

                {/* Needs Attention Section */}

                <div className="cards">
                    {needsAttentionReferrals.map((referral, index) => (
                        <ReferralCard
                            key={index}
                            referral={referral}
                            isExpanded={false}
                            onClick={() => setSelectedReferral(referral)}
                            updateProcessedReferralsCsv={updateCSVRow}
                        />
                    ))}
                </div>

                {/* All Referrals Section */}
                <div className="header">
                    <h2>All Referrals</h2>
                </div>
                <div className="cards">
                    {filteredReferrals.map((referral, index) => (
                        <ReferralCard
                            key={index}
                            referral={referral}
                            isExpanded={false}
                            onClick={() => setSelectedReferral(referral)}
                            updateProcessedReferralsCsv={updateCSVRow}
                        />
                    ))}
                </div>
            </div>

            {/* Expanded View for Selected Referral */}
            {selectedReferral && (
                <div className="popup-overlay">
                    <div className="popup-container">
                        <BigReferralCard
                            refresh={loadData}
                            referral={selectedReferral}
                            isExpanded={true}
                            updateProcessedReferralsCsv={updateCSVRow}
                            onClose={() => {setSelectedReferral(null), loadData()}}
                        />
                        {/* <button onClick={() => setSelectedReferral(null)} className="close-popup-btn"><FaRegWindowClose style={{color:"#000", width:'20px', height:'20px'}}/></button> */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Overview;
