import React, { useState } from "react";
import "./IntakeFlowCard.css";
import Card from "../../components/card/card";

const IntakeFlowCard = ({ flow, onSelect, isSelected }) => {
  console.log("FLOWWW", flow.data)
  return (
    <div
      onClick={onSelect}
    >
      <Card title = {flow.data.title || ''}  subtitle={flow.data.description || ''}  />
    </div>
  );
};

export default IntakeFlowCard;
