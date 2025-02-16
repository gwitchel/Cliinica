import React, { useEffect, useState } from 'react';
import './Overview.css';
import ReferralCard from '../../components/ReferralCard';
import BigReferralCard from '../../components/BigReferralCard';
const { updateCSVRow } = require('../../../data-preprocessing/updateCSVRow');
const { getRecentReferralChanges } = require('../../../queries/getChangelogAfterDate');
const { getNeedsAttention } = require('../../../queries/getNeedsAttention');
const { GetMyToDo } = require('../../../queries/getMyTodo');
import { FaPlus, FaSearch, FaUpload, FaCog, FaChevronRight, FaChevronDown } from 'react-icons/fa';
import { FaArrowRotateLeft } from "react-icons/fa6";
import Papa from 'papaparse';
import RecentChanges from './recentChanges/RecentChanges';

const Overview = ({ userProfile }) => {
    const [referrals, setReferrals] = useState([]);
    const [filteredReferrals, setFilteredReferrals] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [myNextSteps, setMyNextSteps] = useState([]);
    const [filteredMyNextSteps, setFilteredMyNextSteps] = useState([]);
    const [nextStepsSearchQuery, setNextStepsSearchQuery] = useState('');
    const [isAttentionSectionExpanded, setIsAttentionSectionExpanded] = useState(true);
    const [showAllPatient, setShowAllPatients] = useState(true);
    const [changelog, setChangelog] = useState([]);
    const [showPopup, setShowPopup] = useState(false);

    const [showAddPatientModal, setShowAddPatientModal] = useState(false);
    const [newPatientData, setNewPatientData] = useState({ MRN: '', 'Patient Name': '' });
    const [formErrors, setFormErrors] = useState({});


    const loadChangelog = async () => {
        try {
            console.log('Loading changelog...');electronAPI
            const processedData = await window.electron.loadCsv('changelog');
            setChangelog(processedData);
        } catch (error) {
            console.warn('No Changelog Data', error);
        }
    };

    useEffect(() => {
        loadChangelog();
    }, []);

    const loadData = async () => {
        try {
            console.log('Loading referrals...');
            const processedData = await window.electronAPI.loadCsv('patients');
            console.log("CREATING PATEITNS FOUND PATIENTS ",processedData )

            const nextSteps = await GetMyToDo(userProfile);
    
            setMyNextSteps(nextSteps);
            setReferrals(processedData);
            setFilteredReferrals(processedData);
            setFilteredMyNextSteps(nextSteps);
    
            if (processedData.length === 0) {
                console.warn('No Referrals Data - Creating default CSV file');
                console.log("CREATING PATEITNS dsssssss")
                await window.electronAPI.saveCsvFile('patients.csv', [{ MRN: '', 'Patient Name': '' }]);
            }
        } catch (error) {
            console.warn('Error loading referrals, creating default CSV file', error);
            console.log("CREATING PATEITNS dsssssss")
            await window.electronAPI.saveCsvFile('patients.csv', [{ MRN: '', 'Patient Name': '' }]);
        }
    };

    useEffect(() => {
        if (!showOnboarding) {
            loadData();
        }
    }, [showOnboarding]);

    const handleSubmitNewPatient = async () => {
        let errors = {};
    
        if (!newPatientData.MRN.trim()) errors.MRN = 'MRN is required';
        if (!newPatientData['Patient Name'].trim()) errors['Patient Name'] = 'Patient Name is required';
    
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return; // Stop submission if errors exist
        }
    
        // Add new patient to state
        const updatedReferrals = [...referrals, newPatientData];
        setReferrals(updatedReferrals);
        setFilteredReferrals(updatedReferrals);
    
        // Save to CSV
        await window.electronAPI.saveCsvFile('patients.csv', updatedReferrals);
    
        setShowAddPatientModal(false); // Close modal after adding
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPatientData((prev) => ({ ...prev, [name]: value }));
    
        // Clear error message when user starts typing
        setFormErrors((prev) => ({ ...prev, [name]: '' }));
    };

    
    const handleAddNewPatient = () => {
        setNewPatientData({ MRN: '', 'Patient Name': '' }); // Reset form fields
        setFormErrors({}); // Reset errors
        setShowAddPatientModal(true); // Open the modal
    };

    const handleSearch = (event) => {
        const query = event.target.value.toLowerCase();
        setSearchQuery(query);
        setFilteredReferrals(
            referrals.filter(referral => {
                const patientName = referral['Name']?.toLowerCase() || '';
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
                const patientName = referral['Name']?.toLowerCase() || '';
                const mrn = referral['MRN']?.toLowerCase() || '';
                return patientName.includes(query) || mrn.includes(query);
            })
        );
    };

    const handleDeletePatient = (mrn) => {
        if (!userProfile.isAdmin) {
            return alert('You do not have permission to delete patients.');
        }
        const updatedReferrals = referrals.filter(referral => referral['MRN'] !== mrn);
        setReferrals(updatedReferrals);
        setFilteredReferrals(updatedReferrals);
        setSelectedReferral(null);
        window.electronAPI.saveCsvFile('patients.csv', updatedReferrals);

        // Update the changelog to reflect the deletion of a patient
        const change = {
            Date: new Date().toISOString(),
            editor: userProfile._id,
            MRN: mrn,
            field: 'Delete Patient',
            old_value: '',
            new_value: '',
            action: 'Patient Deleted'
        };
        setChangelog([...changelog, change]);
        window.electronAPI.saveCsvFile('changelog.csv', [...changelog, change]);
        handleClosePopup();
        loadData();
    };

    // Open referral in a popup modal
    const handleOpenPopup = (referral) => {
        setSelectedReferral(referral);
        setShowPopup(true);
    };

    // Close popup modal
    const handleClosePopup = () => {
        setShowPopup(false);
        setSelectedReferral(null);
        loadData();
    };

    return (
        <div className="overview">
            {/* <RecentChanges changelog={changelog} /> */}
            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <div className='needs-attention-header'>
                    <div className='needs-attention-header-text'>Needs Attention</div>
                    <div className='needs-attention-header-numerical'>{myNextSteps.length}</div>
                    <input
                        type="text"
                        placeholder="Search"
                        value={nextStepsSearchQuery}
                        onChange={handleSearch2}
                        className="search-bar"
                    />
                </div>
                {isAttentionSectionExpanded && (
                    <div className="grid-container">
                        {filteredMyNextSteps.filter(referral => referral['Patient Name']?.trim() && referral['MRN']?.trim()) // Remove invalid entries
                            .map((referral, index) => (
                            <ReferralCard
                                key={index}
                                referral={referral}
                                isExpanded={false}
                                onClick={() => handleOpenPopup(referral)}
                                updateProcessedReferralsCsv={updateCSVRow}
                            />
                        ))}
                    </div>
                )}

                <div>
                    <div className='needs-attention-header-text'>All Patients</div>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', alignContent: 'center' }}>
                        <div className="add-patient-button" onClick={handleAddNewPatient}>Add patient +</div>
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={handleSearch}
                            className="search-bar"
                        />
                    </div>
                    {showAllPatient && (
                        <div className="grid-container">
                            {filteredReferrals
                            .filter(referral => referral['Patient Name']?.trim() && referral['MRN']?.trim()) // Remove invalid entries
                            .map((referral, index) => (
                                <ReferralCard
                                    key={index}
                                    referral={referral}
                                    isExpanded={false}
                                    onClick={() => handleOpenPopup(referral)}
                                    updateProcessedReferralsCsv={updateCSVRow}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showPopup && (
                <div className="modal-overlay" onClick={handleClosePopup}>
                    <div className="modal-content-2" onClick={(e) => e.stopPropagation()}>
                        <BigReferralCard
                            refresh={loadData}
                            referral={selectedReferral}
                            setChangelog={setChangelog}
                            changelog={changelog}
                            onClose={handleClosePopup}
                            handleDeletePatient={(mrn) => handleDeletePatient(mrn)}
                            userProfile={userProfile}
                        />
                    </div>
                </div>
            )}
            {showAddPatientModal && (
                <div className="modal-overlay" onClick={() => setShowAddPatientModal(false)}>
                    <div className="modal-content-2" onClick={(e) => e.stopPropagation()}>
                        <h2>Add New Patient</h2>

                        {Object.keys(referrals[0] || {}).map((field) => (
                            <div key={field}>
                                <label>{field}</label>
                                <input 
                                    type="text" 
                                    name={field} 
                                    value={newPatientData[field] || ''} 
                                    onChange={handleInputChange} 
                                />
                                {formErrors[field] && <span className="error">{formErrors[field]}</span>}
                            </div>
                        ))}

                        <button 
                            onClick={handleSubmitNewPatient} 
                            disabled={Object.keys(referrals[0] || {}).some(field => !newPatientData[field]?.trim())}
                            className='cancel-button'
                        >
                            Add Patient
                        </button>
                        <button className="cancel-button" onClick={() => setShowAddPatientModal(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Overview;
