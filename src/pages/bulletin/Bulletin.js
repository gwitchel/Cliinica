import React, { useEffect, useState } from 'react';
import ReferralCard from '../../components/ReferralCard';
import BigReferralCard from '../../components/BigReferralCard';
const { updateCSVRow } = require('../../../data-preprocessing/updateCSVRow');
const { getRecentReferralChanges } = require('../../../queries/getChangelogAfterDate');
const { getNeedsAttention } = require('../../../queries/getNeedsAttention');
// import { FaRegWindowClose } from 'react-icons/fa'; // FontAwesome icons
import {FaPlus, FaSearch} from 'react-icons/fa'
import { FaArrowRotateLeft } from "react-icons/fa6"; 

const Bulletin = () => {
    const [referrals, setReferrals] = useState([]);
    const [recentlyChangedReferrals, setRecentlyChangedReferrals] = useState([]);
    const [userProfile, setUserProfile] = useState(null);


    const loadData = async () => {
        try {
            const processedData = await window.electron.loadCsv('patients');
            const userProfile = await window.electron.loadUserProfile();
            setUserProfile(userProfile);
            setReferrals(processedData);
            setFilteredReferrals(processedData);
        } catch (error) {
            console.error('Error loading referrals data:', error);
        }
    };
    useEffect(() => {
        if (!referrals.length) return;
    
        const loadRecentlyChangedReferrals = async () => {
            const changedReferrals = await getRecentlyChangedReferrals(referrals);
            console.log("recently changed referrals",changedReferrals )
            setRecentlyChangedReferrals(changedReferrals);
        };
    
        loadRecentlyChangedReferrals();
    }, [referrals]);

    // recently changed 
    useEffect(() => {
        loadData();
    }, []);

  
    const getRecentlyChangedReferrals = async (referrals) => {
        try {
            const recentChanges = await getRecentReferralChanges(10); // Fetch the 10 most recent changes
            const org = await window.electron.loadCsv('organization'); // Load the organization data
            console.log("recent Changed", recentChanges)
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


   
    return (
        <div>
             <div className="header">
                <h2>Recently Changed Referrals</h2>
            </div>
            <div className="cards">
                {recentlyChangedReferrals
                    .filter((referral, index) =>  index < 5)
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
        </div>
    )
}
export default Bulletin;
