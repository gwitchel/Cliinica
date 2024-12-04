import React from "react";
import {FaTrash} from 'react-icons/fa';

const FlowComponent = ({
  flow,
  index,
  peopleOptions,
  isEditing,
  onEdit,
  onSave,
  onUpdate,
  onDelete,
}) => {
  const updateDeliverable = (value) => {
    onUpdate({ deliverables: [value] });
  };

  const setPersonInvolved = (personId) => {
    onUpdate({ peopleInvolved: personId ? [personId] : [] });
  };

  return (
    <div
      style={{
        padding: "10px",
        display: "flex",
      }}
    >
      {isEditing ? (
        <div style={{display:'flex', flexDirection:'column'}}>
          <div style={{display:'flex', flexDirection:'row', justifyContent:'space-between'}}>
          <h4 style={{marginBottom:'4px'}}>Title</h4>
          <div style={{}} onClick={() => onDelete(flow)}><FaTrash /></div>
          </div>
          <input
            type="text"
            placeholder="Title"
            value={flow.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            style={{
              marginBottom: "10px",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <h4 style={{margin:'4px'}}>Description</h4>
          <textarea
            placeholder="Description"
            value={flow.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            style={{
              flexGrow: 1,
              marginBottom: "10px",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              minHeight: "80px",
            }}
          />
          <div>
            <div style={{display:'flex', flexDirection:'row', alignItems:'center'}}>
              <h4 style={{margin:0}}>People Involved</h4>
              <select
                value={flow.peopleInvolved[0] || ""}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setPersonInvolved(selectedId);
                }}
                style={{
                  marginLeft: '10px',
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
    
                <option value="">Select a person</option>
                {peopleOptions.map((person) => (
                  <option key={person._id} value={person._id}>
                    {`${person.firstName} ${person.lastName} (${person.role})`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{display:'flex', flexDirection:'column'}}>
            <h4 style={{marginBottom:'4px'}}>Deliverable</h4>
            <input
              type="text"
              placeholder="Deliverable"
              value={flow.deliverables[0] || ""}
              onChange={(e) => updateDeliverable(e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                marginTop: "10px",
              }}
            />
          </div>
        </div>
      ) : (
        <div>
          <h3 style={{ margin: "0 0 10px" }}>{flow.title || "Untitled"}</h3>
          <p style={{ margin: "0 0 10px" }}>{flow.description || "No description"}</p>
          <div>
            <h4>Person Involved</h4>
            <ul style={{ paddingLeft: "20px" }}>
              {flow.peopleInvolved.length > 0 ? (
                flow.peopleInvolved.map((id) => {
                  const person = peopleOptions.find((p) => p._id === id);
                  return (
                    <li key={id}>
                      {person
                        ? `${person.firstName} ${person.lastName} (${person.role})`
                        : "Unknown"}
                    </li>
                  );
                })
              ) : (
                <li>No one assigned</li>
              )}
            </ul>
          </div>
          <div>
            <h4>Deliverable</h4>
            <ul style={{ paddingLeft: "20px" }}>
              {flow.deliverables.length > 0 ? (
                flow.deliverables.map((deliverable, i) => (
                  <li key={i}>{deliverable || "Empty"}</li>
                ))
              ) : (
                <li>No deliverables</li>
              )}
            </ul>
          </div>
          <button
            onClick={onEdit}
            style={{
              marginTop: "10px",
              backgroundColor: "#007bff",
              color: "white",
              padding: "10px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default FlowComponent;
