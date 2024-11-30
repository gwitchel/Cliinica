import React, { useEffect, useState } from "react";
const { ipcRenderer } = window.require("electron");
import FlowComponent from "./FlowComponent";

const NewIntakeFlow = ({
  flowData = { title: "", description: "", flows: [], id: Date.now() }, // Accept flow data as a prop
  onFlowUpdate, // External handler for flow updates
  onSave, // Handler for save action
}) => {
  const [flows, setFlows] = useState(flowData.flows || []);
  const [editingFlowId, setEditingFlowId] = useState(null);
  const [title, setTitle] = useState(flowData.title || ""); // Flow title
  const [description, setDescription] = useState(flowData.description || ""); // Flow description
  const [people, setPeople] = useState([]);

  useEffect(() => {
    const loadOrganizations = async () => {
        try {
            const processedData = await window.electron.loadCsv('organization');
            setPeople(processedData);
        } catch (error) {
            console.error('Error loading organizations data:', error);
        }
    };

    console.log('Loading organizations...');
    loadOrganizations();
    
  }, []);

  useEffect(() => {
    if (flows.length === 0) {
      addFlow(false); // Start with a single step if none exist
    }
  }, [flows]);

  const addFlow = (isParallel = false, referenceIndex = flows.length - 1) => {
    const newFlow = {
      id: Date.now(),
      title: "",
      description: "",
      peopleInvolved: [],
      deliverables: [],
    };

    if (referenceIndex < 0) {
      referenceIndex = 0;
    }

    const updatedFlows = [...flows];
    if (referenceIndex !== null) {
      if (isParallel) {
        // Add parallel step by grouping flows at the same index
        if (!Array.isArray(updatedFlows[referenceIndex])) {
          updatedFlows[referenceIndex] = [updatedFlows[referenceIndex]]; // Wrap single objects in an array
        }
        updatedFlows[referenceIndex].push(newFlow);
      } else {
        // Add sequential step by inserting into the next index
        updatedFlows.splice(referenceIndex + 1, 0, [newFlow]); // Always insert as an array
      }
    }
    setFlows(updatedFlows);
    onFlowUpdate({ ...flowData, flows: updatedFlows });
  };

  const onSaveFlow = (flowIndex, newFlow) => {
    const updatedFlows = [...flows];
    if (Array.isArray(updatedFlows[flowIndex])) {
      updatedFlows[flowIndex] = updatedFlows[flowIndex].map((flow) =>
        flow.id === newFlow.id ? newFlow : flow
      );
    } else {
      updatedFlows[flowIndex] = newFlow;
    }
    setFlows(updatedFlows);
    onFlowUpdate({ ...flowData, flows: updatedFlows });
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
    onFlowUpdate({ ...flowData, flows: updatedFlows });
  };

  const handleSave = () => {
    const flowToSave = {
      title,
      description,
      id: flowData.id,
      flows, // Include all steps in the flow
    };

    ipcRenderer.send("save-flow", flowToSave);
    ipcRenderer.once("flow-saved", (event, message) => {
      alert(message); // Display success message after saving
    });
    onSave(false); // Notify parent component of save action
  };

  return (
    <div>
      <div>
        <label>
          Flow Title:
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              onFlowUpdate({ ...flowData, title: e.target.value });
            }}
            placeholder="Enter flow title"
          />
        </label>
      </div>

      <div>
        <label>
          Flow Description:
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              onFlowUpdate({ ...flowData, description: e.target.value });
            }}
            placeholder="Enter flow description"
          />
        </label>
      </div>

      <div>
        {flows.map((flow, index) => (
          <div
            key={Array.isArray(flow) ? `group-${index}` : flow.id}
            style={{
              display: Array.isArray(flow) ? "flex" : "block",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            {Array.isArray(flow)
              ? flow.map((parallelFlow) => (
                  <div key={parallelFlow.id} style={{ flex: 1 }}>
                    <FlowComponent
                      flow={parallelFlow}
                      index={index}
                      peopleOptions={people} // Add appropriate people options
                      isEditing={editingFlowId === parallelFlow.id}
                      onEdit={() => setEditingFlowId(parallelFlow.id)}
                      onSave={(newFlow) => {
                        onSaveFlow(index, newFlow);
                        setEditingFlowId(null);
                      }}
                      onUpdate={(updatedFlow) =>
                        updateFlow(parallelFlow.id, updatedFlow)
                      }
                    />
                  </div>
                ))
              : (
                <div>
                  <FlowComponent
                    flow={flow}
                    index={index}
                    peopleOptions={people} // Add appropriate people options
                    isEditing={editingFlowId === flow.id}
                    onEdit={() => setEditingFlowId(flow.id)}
                    onSave={(newFlow) => {
                      onSaveFlow(index, newFlow);
                      setEditingFlowId(null);
                    }}
                    onUpdate={(updatedFlow) => updateFlow(flow.id, updatedFlow)}
                  />
                </div>
              )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "10px" }}>
        <button onClick={() => addFlow(false)}>Add Sequential Step</button>
        <button onClick={() => addFlow(true)}>Add Parallel Step</button>
      </div>

      <button onClick={handleSave}>Save Flow</button>
    </div>
  );
};

export default NewIntakeFlow;
