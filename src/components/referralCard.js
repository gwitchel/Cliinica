import React from 'react';
import PropTypes from 'prop-types';
import './ReferralCard.css';
import { FaUser, FaTrash } from 'react-icons/fa'; // FontAwesome icons
import Card from './card/card';

const ReferralCard = ({ referral, onClick }) => {
    return (
        <div 
            onClick={onClick} // Select this referral
        >
            <Card
                title={referral.Name}
                subtitle={referral.MRN}
                body={referral.next_steps? referral.next_steps : ''}
            />
        </div>
    );
};

ReferralCard.propTypes = {
    referral: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
};

export default ReferralCard;
