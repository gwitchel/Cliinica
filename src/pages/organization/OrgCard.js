import React from 'react';
import PropTypes from 'prop-types';
import './OrgCard.css'; // Assuming you have some styles for this component

const OrgCard = ({ name, description, logoUrl }) => {
    return (
        <div className="org-card">
            <img src={logoUrl} alt={`${name} logo`} className="org-card-logo" />
            <div className="org-card-content">
                <h2 className="org-card-name">{name}</h2>
                <p className="org-card-description">{description}</p>
            </div>
        </div>
    );
};

OrgCard.propTypes = {
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    logoUrl: PropTypes.string.isRequired,
};

export default OrgCard;