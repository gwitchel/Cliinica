import React from 'react';
import { Icon } from '@iconify/react';
import './Navbar.css';

const Navbar = ({ selected, onSelect, userProfile, setUserProfile }) => {
  const topItems = ['Patients', 'Organization', 'Flows'];
  
  // Only include 'Settings' if user is an admin
  const bottomItems = userProfile.isAdmin ? ['Settings', 'Log out'] : ['Log out'];

  const iconMap = {
    Patients: 'mdi:account-group',
    Organization: 'mdi:domain',
    Flows: 'mdi:swap-horizontal',
    Settings: 'mdi:cog-outline',
    'Log out': 'mdi:logout'
  };

  const handleClick = (item) => {
    if (item === 'Log out') {
      setUserProfile(null);
    } else {
      onSelect(item);
    }
  };

  const renderItem = (item) => (
    <div
      key={item}
      className={`navbar-item ${selected === item ? 'selected' : ''}`}
      onClick={() => handleClick(item)}
    >
      <Icon icon={iconMap[item]} width="24" height="24" />
      <span className="navbar-item-text">{item}</span>
    </div>
  );

  return (
    <div className="navbar">
      <div className="navbar-section navbar-top">
        {topItems.map(renderItem)}
      </div>
      <div className="navbar-section navbar-bottom">
        {bottomItems.map(renderItem)}
      </div>
    </div>
  );
};

export default Navbar;
