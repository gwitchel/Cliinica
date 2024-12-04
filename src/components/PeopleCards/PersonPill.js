import React from 'react';
import PropTypes from 'prop-types';
import './PersonPill.css';
import { FaUser } from 'react-icons/fa';

const PersonPill = ({ person }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '20px',
            backgroundColor: '#2E6A9F',
            color: 'white',
            padding: '5px 10px', // Add padding for spacing
            width: 'fit-content', // Ensure div hugs the content
        }}>
            <FaUser style={{ marginRight: '5px' }} />
            <p style={{
                margin: 0, // Remove default paragraph margins
                fontSize: '14px', // Adjust font size if needed
                lineHeight: 1.5, // Ensure good spacing inside the div
            }}>
                {person.firstName} {person.lastName}
            </p>
        </div>
    );
};

PersonPill.propTypes = {
    person: PropTypes.shape({
        firstName: PropTypes.string.isRequired,
        lastName: PropTypes.string.isRequired,
    }).isRequired,
};

export default PersonPill;
