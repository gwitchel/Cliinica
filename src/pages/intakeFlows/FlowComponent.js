import React, { useState } from "react";

const FlowComponent = ({ flow, index, peopleOptions, isEditing, onEdit, onSave, onUpdate }) => {
  const addDeliverable = () => {
    onUpdate({ deliverables: [...flow.deliverables, ""] });
  };

  const updateDeliverable = (index, value) => {
    const updatedDeliverables = [...flow.deliverables];
    updatedDeliverables[index] = value;
    onUpdate({ deliverables: updatedDeliverables });
  };

  const addPersonInvolved = (personId) => {
    if (!flow.peopleInvolved.includes(personId)) {
      onUpdate({
        peopleInvolved: [...flow.peopleInvolved, personId],
      });
    }
  };

  const removePersonInvolved = (personId) => {
    onUpdate({
      peopleInvolved: flow.peopleInvolved.filter((id) => id !== personId),
    });
  };

  return (
    <div style={{ border: "1px solid black", padding: "10px" }}>
      {isEditing ? (
        <div>
          <input
            type="text"
            placeholder="Title"
            value={flow.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
          <textarea
            placeholder="Description"
            value={flow.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
          />
          <div>
            <h4>People Involved</h4>
            <div>
              <select
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (selectedId) {
                    addPersonInvolved(selectedId);
                  }
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
            <ul>
              {flow.peopleInvolved.map((id) => {
                const person = peopleOptions.find((p) => p._id === id);
                return (
                  <li key={id}>
                    {person
                      ? `${person.firstName} ${person.lastName} (${person.role})`
                      : "Unknown"}
                    <button
                      style={{ marginLeft: "10px" }}
                      onClick={() => removePersonInvolved(id)}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h4>Deliverables</h4>
            {flow.deliverables.map((deliverable, index) => (
              <input
                key={index}
                type="text"
                placeholder="Deliverable"
                value={deliverable}
                onChange={(e) => updateDeliverable(index, e.target.value)}
              />
            ))}
            <button onClick={addDeliverable}>Add Deliverable</button>
          </div>
          <button onClick={() => onSave(flow, index)}>Save</button>
        </div>
      ) : (
        <div>
          <h3>{flow.title || "Untitled"}</h3>
          <p>{flow.description || "No description"}</p>
          <div>
            <h4>People Involved</h4>
            <ul>
              {flow.peopleInvolved.map((id) => {
                const person = peopleOptions.find((p) => p._id === id);
                return (
                  <li key={id}>
                    {person
                      ? `${person.firstName} ${person.lastName} (${person.role})`
                      : "Unknown"}
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h4>Deliverables</h4>
            <ul>
              {flow.deliverables.map((deliverable, index) => (
                <li key={index}>{deliverable || "Empty"}</li>
              ))}
            </ul>
          </div>
          <button onClick={onEdit}>Edit</button>
        </div>
      )}
    </div>
  );
};

export default FlowComponent;
