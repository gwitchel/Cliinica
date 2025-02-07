import React, { useState, useEffect } from "react";
const { ipcRenderer } = window.require("electron");
import IntakeFlowCard from "./IntakeFlowCard";
import BigIntakeFlowCard from "./BigIntakeFlowCard";
import NewIntakeFlow from "./NewIntakeFlow";
import "./IntakeFlows.css";
import {FaPlus} from 'react-icons/fa';


const IntakeFlows = ({userProfile}) => {
  const [showNewFlow, setShowNewFlow] = useState(false);
  const [jsonData, setJsonData] = useState([]);
  const [error, setError] = useState(null);
  const [selectedFlow, setSelectedFlow] = useState(null)
  const [organization, setOrganization] = useState(null)

  const fetchOrganization = async () => {
    try {
      const data = await window.electron.loadCsv('organization');
      setOrganization(data); // Set the loaded data
    } catch (err) {
      console.warn("Error loading JSON data: " + err.message);
    }
  };

  console.log("SHownewFlow", showNewFlow)
  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchJsonData = async () => {
    try {
      const data = await ipcRenderer.invoke("load-all-json"); // Request all JSON data
      setJsonData(data); // Set the loaded data
    } catch (err) {
      setError("Error loading JSON data: " + err.message);
    }
  };

  console.log("SHownewFlow", showNewFlow)
  // Load all JSON files when the component mounts
  useEffect(() => {
    if(!showNewFlow){
      fetchJsonData();
    }
  }, [setShowNewFlow]);

  // Add a new flow to the list
  const handleAddNewFlow = () => {
    console.log('Adding new flow')
    setShowNewFlow(true);
    setSelectedFlow(null)
  };

  const handleFlowSelect = (flow) => {
    setSelectedFlow((prev) => (prev === flow ? null : flow));
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
      <div style={{display:'flex', flexDirection:'row', width: '100%', flexGrow: 1, justifyContent: 'space-between'}}>
        <div className="flow-grid">
          {jsonData.map((flow,index) => (
            <IntakeFlowCard
              key={index}
              flow={flow}
              isSelected = {selectedFlow == flow}
              onSelect={() => handleFlowSelect(flow)}
            />
          ))}
            {/* Add New Flow Button */}
        
          {(!showNewFlow && userProfile.isAdmin) && <button className="add-new-flow-bttn"onClick={handleAddNewFlow}>Add new flow +</button>}
          {/* Add New Flow Button */}
          {showNewFlow && <button onClick={() => setShowNewFlow(false)} style={{backgroundColor: "#ED7390", color: "white", padding: "10px", border: "none", borderRadius: "4px" }}>Cancel</button>}
          
          {/* Refresh Button */}
          {/* <button onClick={handleRefresh}>Refresh</button> */}
        </div>
        {(showNewFlow || selectedFlow) && 
          <div className="active-flow">
            {showNewFlow && (
              <NewIntakeFlow
                flowData={{ 
                  id: Date.now(),
                  title: "", 
                  description: "", 
                  flows: []}} // Empty flow structure
                // onFlowUpdate={(flow) => {setSelectedFlow(flow)}} // No live updates for new flows
                onSave={(flow)=>{setSelectedFlow(flow), setShowNewFlow(false), fetchJsonData()}} // Save and close
              />
            )}
            { (selectedFlow && !showNewFlow) && (
              <BigIntakeFlowCard
                flow ={selectedFlow}
                onDelete={(flow) => {
                  if(organization && userProfile && userProfile.isAdmin){
                    window.electron.deleteFlow(flow.data.title); setSelectedFlow(null), fetchJsonData()
                  } else {
                    alert('You do not have permission to delete this flow')
                  }
                }}
                organization = {organization}
              />
            )}
          </div>
        }
      </div>
  );
};

export default IntakeFlows;
