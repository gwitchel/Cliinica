import React, { useEffect, useState } from "react";
import FlowComponent from "./FlowComponent";
import "./NewIntakeFlow.css";
import './BigIntakeFlowCard.css'
const { ipcRenderer } = window.require("electron");

const NewIntakeFlow = ({
  flowData = { title: "", description: "", flows: [], id: Date.now() },
  // onFlowUpdate,
  onSave,
}) => {
  const [flows, setFlows] = useState(flowData.flows || []);
  const [title, setTitle] = useState(flowData.title || "");
  const [description, setDescription] = useState(flowData.description || "");
  const [people, setPeople] = useState([]);

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const processedData = await window.electron.loadCsv("organization");
        setPeople(processedData);
      } catch (error) {
        console.error("Error loading organizations data:", error);
      }
    };

    loadOrganizations();
  }, []);

  const addFlow = (isParallel = false, referenceIndex = flows.length - 1) => {
    const newFlow = {
      id: Date.now(),
      title: "",
      description: "",
      peopleInvolved: [],
      deliverables: [],
    };

    const updatedFlows = [...flows];
    if (isParallel) {
      if (!Array.isArray(updatedFlows[referenceIndex])) {
        updatedFlows[referenceIndex] = [updatedFlows[referenceIndex]];
      }
      updatedFlows[referenceIndex].push(newFlow);
    } else {
      updatedFlows.splice(referenceIndex + 1, 0, [newFlow]);
    }

    setFlows(updatedFlows);
  };

  const updateFlow = (id, updatedFlow) => {
    const updateRecursive = (flowList) =>
      flowList.map((flow) =>
        Array.isArray(flow)
          ? updateRecursive(flow)
          : flow.id === id
          ? { ...flow, ...updatedFlow }
          : flow
      );

    const updatedFlows = updateRecursive(flows);
    setFlows(updatedFlows);
  };

  const deleteFlow = (idToDelete) => {
  // Recursively delete steps, handling both sequential and parallel flows
  const deleteRecursive = (flowList) =>
    flowList
      .map((flow) =>
        Array.isArray(flow)
          ? deleteRecursive(flow) // Recurse for parallel flows
          : flow.id !== idToDelete ? flow : null // Keep flow if not matching id
      )
      .filter((item) => item !== null && (!Array.isArray(item) || item.length > 0)); // Filter out nulls and empty arrays

  const updatedFlows = deleteRecursive(flows);
  setFlows(updatedFlows);
  };

  const handleSave = () => {
    const missingFields = [];
  
    // Check the title and description
    if (!title.trim()) {
      missingFields.push("Flow Title");
    }
    if (!description.trim()) {
      missingFields.push("Flow Description");
    }
  
    // Check all steps in the flow
    flows.forEach((sequence, seqIndex) => {
      sequence.forEach((step, stepIndex) => {
        if (!step.title.trim()) {
          missingFields.push(`Step ${stepIndex + 1} in Sequence ${seqIndex + 1} - Title`);
        }
        if (!step.description.trim()) {
          missingFields.push(`Step ${stepIndex + 1} in Sequence ${seqIndex + 1} - Description`);
        }
        if (!step.peopleInvolved.length) {
          missingFields.push(`Step ${stepIndex + 1} in Sequence ${seqIndex + 1} - People Involved`);
        }
        if (!step.deliverables.length || !step.deliverables[0].trim()) {
          missingFields.push(`Step ${stepIndex + 1} in Sequence ${seqIndex + 1} - Deliverable`);
        }
      });
    });
  
    // If there are missing fields, alert the user and stop save
    if (missingFields.length > 0) {
      alert(`In order to save your flow please make sure all the fields are filled out. Missing fields :\n- ${missingFields.join("\n- ")}`);
      return;
    }
  
    // Proceed with saving if all fields are filled
    const flowToSave = { title, description, id: flowData.id, flows };
    ipcRenderer.send("save-flow", flowToSave);
    ipcRenderer.once("flow-saved", (event, message) => alert(message));
    onSave({ data: flowToSave });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        width: "100%",
      }}
    >
      <div style={{ marginBottom: "20px", width: "100%" }}>
        <label style={{ display: "block", width: "100%" }}>
          <h2 style={{ margin: "0 0 10px" }}>Flow Title:</h2>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
            style={{
              display: "block",
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
              backgroundColor:'transparent',
            }}
          />
        </label>
      </div>
  
      <div style={{ marginBottom: "20px", width: "100%" }}>
        <label style={{ display: "block", width: "100%" }}>
          <div className="flow-step-title" style={{ margin: "0 0 10px" }}>
            Flow Description:
          </div>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
            }}
            style={{
              backgroundColor:'transparent',
              color: '#fff',
              display: "block",
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              minHeight: "100px",
              boxSizing: "border-box",
            }}
          />
        </label>
      </div>
  
      <div>
        {flows.map((sequence, seqIndex) => (
          <div key={seqIndex} style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexDirection: "row",
                flexWrap: "nowrap",
                overflowX: "auto",
              }}
            >
              {sequence.map((step, stepIndex) => (
     
                  <FlowComponent
                    flow={step}
                    peopleOptions={people}
                    isEditing={true}
                    onUpdate={(updatedFlow) => updateFlow(step.id, updatedFlow)}
                    onDelete={() => deleteFlow(step.id)}
                  />
           
              ))}
            </div>
          </div>
        ))}
      </div>
  
      <div style={{ marginTop: "20px", width: "100%" }}>
        <button
          onClick={() => addFlow(false)}
          style={{
            padding: "10px",
            border: "none",
            borderRadius: "4px",
            marginRight: "10px",
            marginTop: "8px",
          }}
        >
          Add Sequential Step
        </button>
        <button
          onClick={() => addFlow(true)}
          style={{
            padding: "10px",
            border: "none",
            borderRadius: "4px",
            marginRight: "10px",
            marginTop: "8px",
          }}
        >
          Add Parallel Step
        </button>
      </div>
      <button
        onClick={handleSave}
        style={{
          backgroundColor: "#2E6A9F",
          color: "white",
          padding: "10px",
          border: "none",
          borderRadius: "4px",
          marginTop: "16px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        Save Flow
      </button>
    </div>
  );
  
};

export default NewIntakeFlow;
