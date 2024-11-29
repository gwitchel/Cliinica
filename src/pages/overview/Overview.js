import React, { useEffect, useState } from 'react';
import './Overview.css';
import ReferralCard from '../../components/ReferralCard';
import BigReferralCard from '../../components/BigReferralCard';
const { updateCSVRow } = require('../../../data-preprocessing/updateCSVRow');
const { getRecentReferralChanges } = require('../../../queries/getChangelogAfterDate');
const { getNeedsAttention } = require('../../../queries/getNeedsAttention');
// import { FaRegWindowClose } from 'react-icons/fa'; // FontAwesome icons

const Overview = () => {
    const [referrals, setReferrals] = useState([]);
    const [filteredReferrals, setFilteredReferrals] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [recentlyChangedReferrals, setRecentlyChangedReferrals] = useState([]);
    const [isRecentChangesCollapsed, setIsRecentChangesCollapsed] = useState(false);
    const [needsAttentionReferrals, setNeedsAttentionReferrals] = useState([]);

    const loadData = async () => {
        try {
            const processedData = await window.electron.loadCsv('referrals-legacy');
            const userProfile = await window.electron.loadUserProfile();
            setUserProfile(userProfile);
            setReferrals(processedData);
            setFilteredReferrals(processedData);
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

    useEffect(() => {
        loadData();
        getNeedsAttention2();
    }, []);

    useEffect(() => {
        if (!referrals.length) return;
    
        const loadRecentlyChangedReferrals = async () => {
            const changedReferrals = await getRecentlyChangedReferrals(referrals);
            setRecentlyChangedReferrals(changedReferrals);
        };
    
        loadRecentlyChangedReferrals();
    }, [referrals]);

    const getRecentlyChangedReferrals = async (referrals) => {
        try {
            const recentChanges = await getRecentReferralChanges(10); // Fetch the 10 most recent changes
            const org = await window.electron.loadCsv('organization'); // Load the organization data
            let changedReferrals = [];

            recentChanges.forEach((change) => {
                const mrn = change['MRN']; // Get MRN from the change
                const referral = referrals.find((ref) => ref['MRN'] === mrn); // Find the matching referral
                const user = org.find((item) => item['_id'] === change['Changed By']); // Find the user who made the change

                if (!referral) return; // Skip if no matching referral is found

                // Check if the referral is already in the changedReferrals array
                let existingReferral = changedReferrals.find((item) => item['MRN'] === mrn);

                if (!existingReferral) {
                    // If not, add it with the current change and user details
                    changedReferrals.push({ ...referral, changes: [change], user });
                } else {
                    // If it exists, append the new change
                    changedReferrals = changedReferrals.map((item) => {
                        if (item['MRN'] === mrn) {
                            return { ...item, changes: [...item.changes, change], user };
                        }
                        return item;
                    });
                }
            });

        return changedReferrals; // Return the processed recently changed referrals
    } catch (error) {
        console.error('Error fetching recently changed referrals:', error);
        return [];
    }
    };

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

    return (
        <div className="app-container">
            <h1>{userProfile ? `Hello, ${userProfile.firstName} ${userProfile.lastName}` : 'Loading user profile...'}</h1>
            <button onClick={handleAddNewPatient} className="add-patient-btn">Add New Patient</button>
            <button onClick={loadData} className="refresh-btn">Refresh</button>
            <div>
                <input
                    type="text"
                    placeholder="Search referrals by name or MRN"
                    value={searchQuery}
                    onChange={handleSearch}
                    className="search-bar"
                />

                {/* Needs Attention Section */}
                <div className="header">
                    <h2>Needs Attention</h2>
                </div>
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

            {/* recently changed referrals  */}
            <div className="header">
                <h2>Recently Changed Referrals</h2>
                <button onClick={() => setIsRecentChangesCollapsed(!isRecentChangesCollapsed)}>
                    {isRecentChangesCollapsed ? 'Expand' : 'Collapse'}
                </button>
            </div>
            <div className="cards">
                {recentlyChangedReferrals
                    .filter((referral, index) => !isRecentChangesCollapsed || index < 5)
                    .map((referral, index) => (
                        <ReferralCard
                            key={index}
                            referral={referral}
                            isExpanded={false}
                            onClick={() => setSelectedReferral(referral)}
                            updateProcessedReferralsCsv={updateCSVRow}
                        />
                    ))}
            </div>
            {/* Expanded View for Selected Referral */}
            {selectedReferral && (
                <div className="popup-overlay">
                    <div className="popup-container">
                        <BigReferralCard
                            referral={selectedReferral}
                            isExpanded={true}
                            updateProcessedReferralsCsv={updateCSVRow}
                            onClose={() => setSelectedReferral(null)}
                        />
                        {/* <button onClick={() => setSelectedReferral(null)} className="close-popup-btn"><FaRegWindowClose style={{color:"#000", width:'20px', height:'20px'}}/></button> */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Overview;
