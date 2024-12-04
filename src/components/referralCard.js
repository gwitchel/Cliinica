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
                <div><strong> {referral.Name}</strong></div>
                <div>{referral.MRN}</div>
                {referral.next_steps && <div>{referral.next_steps}</div>}
            </div>
        </div>
    );
};

ReferralCard.propTypes = {
    referral: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
};

export default ReferralCard;
