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

    const loadChangelog = async () => {
        try {
            console.log('Loading changelog...');
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
            const processedData = await window.electron.loadCsv('patients');
            const nextSteps = await GetMyToDo(userProfile);
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
        if (!showOnboarding) {
            loadData();
        }
    }, [showOnboarding]);

    const handleAddNewPatient = () => {
        console.log("Adding new patient");
        // Check if referrals is not empty
        const newPatient = referrals.length > 0
            ? Object.keys(referrals[0]).reduce((acc, key) => {
                acc[key] = ''; // Initialize each field with an empty string
                return acc;
            }, {})
            : {};

        console.log("New Patient", newPatient);

        // Add empty patient to state
        const updatedReferrals = [...referrals, newPatient];
        setReferrals(updatedReferrals);
        setFilteredReferrals(updatedReferrals);

        // Select and expand the new patient for editing
        setSelectedReferral(newPatient);

        // Update the changelog to reflect the addition of a new patient
        const change = {
            Date: new Date().toISOString(),
            editor: userProfile._id,
            MRN: newPatient.MRN,
            field: 'New Patient',
            old_value: '',
            new_value: '',
            action: 'Patient Added'
        };
        setChangelog([...changelog, change]);
        window.electron.saveCsvFile('changelog.csv', [...changelog, change]);
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
        if (userProfile.isAdmin !== "true") {
            return alert('You do not have permission to delete patients.');
        }
        const updatedReferrals = referrals.filter(referral => referral['MRN'] !== mrn);
        setReferrals(updatedReferrals);
        setFilteredReferrals(updatedReferrals);
        setSelectedReferral(null);
        window.electron.saveCsvFile('patients.csv', updatedReferrals);

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
        window.electron.saveCsvFile('changelog.csv', [...changelog, change]);
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
                        {filteredMyNextSteps.map((referral, index) => (
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
                            {filteredReferrals.map((referral, index) => (
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
        </div>
    );
};

export default Overview;
