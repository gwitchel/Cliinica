import React from 'react';
import PropTypes from 'prop-types';
import './ReferralCard.css';
import { FaUser, FaTrash } from 'react-icons/fa'; // FontAwesome icons

const ReferralCard = ({ referral, onClick }) => {
    return (
        <div 
            className='card' 
            onClick={onClick} // Select this referral
        >
            <div className="card-header">
                <FaUser style={{width: 35, height: 35, fill: '#323232'}}/>
                <div><strong> {referral.Name}</strong></div>
                <div>{referral.MRN}</div>
                {/* {referral['user'] && <div><strong>Changed By:</strong> {referral['user']['firstName']} {referral['user']['lastName']}</div>} */}
                {/* {referral['Date'] && <div><strong>Date:</strong> {referral['Date']}</div>} */}
            </div>
        </div>
    );
};

ReferralCard.propTypes = {
    referral: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
};

export default ReferralCard;
