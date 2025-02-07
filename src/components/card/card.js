import React from 'react';
import PropTypes from 'prop-types';
import './card.css';

const Card = ({ title, subtitle, body, footer }) => {
    return (
        <div className="card">
            <div className="card-header">
                <div className='card-title'>{title}</div>
                <div className='card-subtitle'>{subtitle}</div>
            </div>
            <div className="card-description">
                {body}
            </div>
            <div className="card-footer">
                {footer}
            </div>
        </div>
    );
};

Card.propTypes = {
    title: PropTypes.string,
    subtitle: PropTypes.string,
    body: PropTypes.string,
    footer: PropTypes.string,
};

export default Card;