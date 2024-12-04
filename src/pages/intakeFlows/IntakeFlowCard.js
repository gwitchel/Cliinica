import React, { useState } from "react";
import "./IntakeFlowCard.css";
const IntakeFlowCard = ({ flow, onSelect, isSelected }) => {

  return (
    <div
      className={isSelected ? 'little-f-card selected' : 'little-f-card' }
      onClick={onSelect}
    >
      <h4 style={{margin:'2px'}}>{flow.data.title || ''}</h4>
      <p style={{margin:'2px'}}>{flow.data.description}</p>
    </div>
  );
};

export default IntakeFlowCard;
