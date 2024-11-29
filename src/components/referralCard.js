import React from 'react';
import PropTypes from 'prop-types';
import './ReferralCard.css';
import { FaUser, FaTrash } from 'react-icons/fa'; // FontAwesome icons

const ReferralCard = ({ referral, isSelected, onClick }) => {
    return (
        <div 
            className={`card ${isSelected ? 'spotlight' : ''}`} 
            onClick={onClick} // Select this referral
        >
            <div className="card-header">
                <FaUser style={{width: 35, height: 35, fill: '#323232'}}/>
                <div><strong> {referral.Name}</strong></div>
                <div><strong>{referral.MRN}</strong> </div>
                {/* {referral['user'] && <div><strong>Changed By:</strong> {referral['user']['firstName']} {referral['user']['lastName']}</div>} */}
                {/* {referral['Date'] && <div><strong>Date:</strong> {referral['Date']}</div>} */}
            </div>
        </div>
    );
};

ReferralCard.propTypes = {
    referral: PropTypes.object.isRequired,
    isSelected: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
};

export default ReferralCard;
