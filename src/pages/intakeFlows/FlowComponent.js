import React from "react";
import { FaTrash } from "react-icons/fa";
import "./flowComponent.css";

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
    <div className="flow-container">
      {isEditing ? (
        <div className="flow-edit-container">
          <div className="flow-title-container">
            <h4>Title</h4>
            <div onClick={() => onDelete(flow)}>
              <FaTrash />
            </div>
          </div>
          <input
            type="text"
            placeholder="Title"
            value={flow.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="flow-input"
          />
          <h4 className="flow-label">Description</h4>
          <textarea
            placeholder="Description"
            value={flow.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="flow-textarea"
          />
          <div className="people-container">
            <h4>People Involved</h4>
            <select
              value={flow.peopleInvolved[0] || ""}
              onChange={(e) => setPersonInvolved(e.target.value)}
              className="flow-select"
            >
              <option value="">Select a person</option>
              {peopleOptions.map((person) => (
                <option key={person._id} value={person._id}>
                  {`${person.firstName} ${person.lastName} (${person.role})`}
                </option>
              ))}
            </select>
          </div>
          <div className="deliverable-container">
            <h4>Deliverable</h4>
            <input
              type="text"
              placeholder="Deliverable"
              value={flow.deliverables[0] || ""}
              onChange={(e) => updateDeliverable(e.target.value)}
              className="flow-input"
            />
          </div>
        </div>
      ) : (
        <div className="flow-view-container">
          <h3 className="flow-title">{flow.title || "Untitled"}</h3>
          <p className="flow-description">{flow.description || "No description"}</p>
          <div>
            <h4>Person Involved</h4>
            <ul className="flow-list">
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
            <ul className="flow-list">
              {flow.deliverables.length > 0 ? (
                flow.deliverables.map((deliverable, i) => (
                  <li key={i}>{deliverable || "Empty"}</li>
                ))
              ) : (
                <li>No deliverables</li>
              )}
            </ul>
          </div>
          <button onClick={onEdit} className="flow-edit-button">
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default FlowComponent;
