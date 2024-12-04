import React, { useEffect, useState } from 'react';
import './Overview.css';
import ReferralCard from '../../components/ReferralCard';
import BigReferralCard from '../../components/BigReferralCard';
const { updateCSVRow } = require('../../../data-preprocessing/updateCSVRow');
const { getRecentReferralChanges } = require('../../../queries/getChangelogAfterDate');
const { getNeedsAttention } = require('../../../queries/getNeedsAttention');
const {GetMyToDo} = require('../../../queries/getMyTodo');
import {FaPlus, FaSearch, FaUpload, FaCog, FaChevronRight, FaChevronDown} from 'react-icons/fa'
import { FaArrowRotateLeft } from "react-icons/fa6";
import Papa from 'papaparse';
const fs = require('fs');
const path = require('path');

const Overview = () => {
    const [referrals, setReferrals] = useState([]);
    const [filteredReferrals, setFilteredReferrals] = useState([]);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [myNextSteps, setMyNextSteps] = useState([]);
    const [filteredMyNextSteps, setFilteredMyNextSteps] = useState([]);
    const [nextStepsSearchQuery, setNextStepsSearchQuery] = useState('');

    const [isAttentionSectionExpanded, setIsAttentionSectionExpanded] = useState(true); // Toggle for attention section
    const [showAllPatient, setShowAllPatients] = useState(true); // Toggle for all patients section

    const loadData = async () => {
        try {
            console.log('Loading referrals...');
            const processedData = await window.electron.loadCsv('patients');
            const nextSteps = await GetMyToDo();
            setMyNextSteps(nextSteps);
            setReferrals(processedData);
            setFilteredReferrals(processedData);
            setFilteredMyNextSteps(nextSteps);
            if (processedData.length === 0) {
                setShowOnboarding(true);
            }
        } catch (error) {
            console.warn('No Referrals Data', error);
            setShowOnboarding(true);
        }
    };

    useEffect(() => {
        if(!showOnboarding){
            loadData();
        }
    }, [showOnboarding]);


    const handleAddNewPatient = () => {
        if (referrals.length === 0) return alert('Please upload a CSV file first.');
    
        console.log('Adding new patient...');
        console.log(referrals[0]); // Logs the first referral object
    
        // Use Object.keys() to get the keys of the first referral object
        const newPatient = Object.keys(referrals[0]).reduce((acc, key) => {
            acc[key] = ''; // Initialize each field with an empty string
            return acc;
        }, {});
    
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

    const handleSearch2 = (event) => {
        const query = event.target.value.toLowerCase();
        setNextStepsSearchQuery(query);

        setFilteredMyNextSteps(
            myNextSteps.filter(referral => {
                const patientName = referral['Patient Name']?.toLowerCase() || '';
                const mrn = referral['MRN']?.toLowerCase() || '';
                return patientName.includes(query) || mrn.includes(query);
            })
        );
    };

    const handleDeletePatient = (mrn) => {
        const updatedReferrals = referrals.filter(referral => referral['MRN'] !== mrn);
        setReferrals(updatedReferrals);
        setFilteredReferrals(updatedReferrals);
        setSelectedReferral(null);
        window.electron.saveCsvFile('patients.csv', updatedReferrals);
        loadData();
    }

    const handleFileUpload = async (event) => {
        console.log('Uploading file...');
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
                {/* <button onClick={() => {}} className="refresh-btn">
                    <FaCog /> Define Custom Headers
                </button> */}
            </div>
        )

    }
    return (
        <div className="app-container">
            <div className='search-controls'>
                <div style={{display:'flex', flexDirection:'row', alignItems: 'center'}}>
                    <div
                            style={{padding: '8px', cursor: 'pointer'}}
                            onClick={() => setIsAttentionSectionExpanded(!isAttentionSectionExpanded)}
                    >
                        {isAttentionSectionExpanded ? <FaChevronDown/> : <FaChevronRight/>}
                    </div>
                    <div style={{display:'flex', flexDirection:'column', marginRight: '8px'}}>
                        <h2 style={{padding: 0, margin: 0}}><span> {referrals.length} patients</span> </h2>
                        <h5 style={{ padding: 0, margin: 0}}> {myNextSteps.length} needs your attention </h5>
                    </div>
                    <input
                            type="text"
                            placeholder="Search"
                            value={nextStepsSearchQuery}
                            onChange={handleSearch2}
                            className="search-bar"
                    />
                </div>
                <div className='search-controls-right'>
                <button onClick={handleAddNewPatient} className="add-patient-btn"><FaPlus/></button>
                <button onClick={loadData} className="refresh-btn"><FaArrowRotateLeft/></button>
                {/* <button onClick={()=>{}} className="refresh-btn"><FaUpload/></button> */}
                </div>

            </div> 
            <div>

                {/* Needs Attention Section */}
                {isAttentionSectionExpanded && (
                        <div className="cards">
                            {filteredMyNextSteps.map((referral, index) => (
                                <ReferralCard
                                    key={index}
                                    referral={referral}
                                    isExpanded={false}
                                    onClick={() => setSelectedReferral(referral)}
                                    updateProcessedReferralsCsv={updateCSVRow}
                                />
                            ))}
                        </div>
                    )}
                {/* All Referrals Section */}
                <div className="header">
                    <div
                        style={{padding: '8px', cursor: 'pointer'}}
                        onClick={() => setShowAllPatients(!showAllPatient)}
                    >
                        {showAllPatient ? <FaChevronDown/> : <FaChevronRight/>}
                    </div>
                    <h2>All Patients</h2>
                    <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={handleSearch}
                            className="search-bar"
                    />
                </div>
                {showAllPatient && (
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
                </div>)}
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
                            handleDeletePatient={(mrn) => handleDeletePatient(mrn)}
                        />
                        {/* <button onClick={() => setSelectedReferral(null)} className="close-popup-btn"><FaRegWindowClose style={{color:"#000", width:'20px', height:'20px'}}/></button> */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Overview;
