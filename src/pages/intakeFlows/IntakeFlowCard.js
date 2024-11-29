import React, { useState } from "react";
import NewIntakeFlow from "./NewIntakeFlow";

const IntakeFlowCard = ({ flow, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleFlowUpdate = (updatedFlowData) => {
    onUpdate({
      ...flow,
      data: updatedFlowData,
    });
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "10px",
        marginBottom: "10px",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={toggleExpansion}
      >
        <h3>{flow.title}</h3>
        <button>{isExpanded ? "Collapse" : "Expand"}</button>
      </div>
      {isExpanded ? (
        <NewIntakeFlow
          flowData={flow.data} // Pass the current flow data to NewIntakeFlow
          onFlowUpdate={handleFlowUpdate} // Update the parent flow when changes occur
          onSave={() => setIsExpanded(false)} // Collapse the card on save
        />
      ) : (
        <div>
          <h1>{flow.data.title}</h1>
          <p>{flow.data.description}</p>
        </div>
      )}
    </div>
  );
};

export default IntakeFlowCard;
