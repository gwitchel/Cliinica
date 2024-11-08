import React from 'react';

const ReferralCard = ({ referral }) => {
  return (
    <div style={{ border: '1px solid black', padding: '10px', margin: '10px' }}>
        <h6>{referral['Name']}</h6>
      <h6>{referral['Clinic Date']}</h6>
      
    </div>
  );
};

export default ReferralCard;
