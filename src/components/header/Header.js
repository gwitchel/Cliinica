import React from 'react';
import './Header.css';

const Header = ({ name }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="header">
      <div className="header-left">
        <img src="./logo.png" className="header-left-image" alt="Logo" />
        <div className="header-left-text">Cliinica</div>
      </div>
      <div className="header-right">
        <div className="header-right-text">{name}</div>
        <div className="header-right-subtext">{currentDate}</div>
      </div>
    </div>
  );
};

export default Header;
