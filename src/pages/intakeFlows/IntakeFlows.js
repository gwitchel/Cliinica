import React, { useState, useEffect } from "react";
import NewIntakeFlow from "./NewIntakeFlow";
const { ipcRenderer } = window.require("electron");
import IntakeFlowCard from "./IntakeFlowCard";
import "./IntakeFlows.css";

const IntakeFlows = () => {
  const [showNewFlow, setShowNewFlow] = useState(false);
  const [jsonData, setJsonData] = useState([]);
  const [error, setError] = useState(null);

  // Fetch JSON data from the main process
  const fetchJsonData = async () => {
    try {
      const data = await ipcRenderer.invoke("load-all-json"); // Request all JSON data
      setJsonData(data); // Set the loaded data
    } catch (err) {
      setError("Error loading JSON data: " + err.message);
    }
  };

  // Load all JSON files when the component mounts
  useEffect(() => {
    fetchJsonData();
  }, []);

  // Add a new flow to the list
  const handleAddNewFlow = () => {
    setShowNewFlow(true);
  };

  // Save the newly created flow and add it to the list
  const handleSaveNewFlow = (newFlow) => {
    setJsonData((prevData) => [...prevData, newFlow]);
    setShowNewFlow(false);
  };

  // Handle updates to a specific flow in the list
  const handleUpdateFlow = (updatedFlow) => {
    setJsonData((prevData) =>
      prevData.map((flow) => (flow.id === updatedFlow.id ? updatedFlow : flow))
    );
  };

  // Refresh button click to reload the data
  const handleRefresh = () => {
    fetchJsonData();
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <div>
        <h2>All Loaded Flows</h2>
        {jsonData.length > 0 ? (
          <div className="flow-grid">
            {jsonData.map((flow) => (
              <IntakeFlowCard
                key={flow.id}
                flow={flow}
                onUpdate={handleUpdateFlow} // Pass the update handler to IntakeFlowCard
              />
            ))}
          </div>
        ) : (
          <p>No flows available.</p>
        )}
      </div>

      {/* Add New Flow Button */}
      <button onClick={handleAddNewFlow}>Add New Flow</button>

      {/* Refresh Button */}
      <button onClick={handleRefresh}>Refresh</button>

      {/* Conditionally render the NewIntakeFlow component */}
      {showNewFlow && (
        <NewIntakeFlow
          flowData={{ 
            id: Date.now(),
            title: "", 
            description: "", 
            flows: []}} // Empty flow structure
          onFlowUpdate={() => {}} // No live updates for new flows
          onSave={(newFlow) => handleSaveNewFlow(newFlow)} // Save and close
        />
      )}
    </div>
  );
};

export default IntakeFlows;
