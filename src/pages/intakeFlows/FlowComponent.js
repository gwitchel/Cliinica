import React from "react";

const FlowComponent = ({
  flow,
  index,
  peopleOptions,
  isEditing,
  onEdit,
  onSave,
  onUpdate,
}) => {
  const updateDeliverable = (value) => {
    onUpdate({ deliverables: [value] });
  };

  const setPersonInvolved = (personId) => {
    onUpdate({ peopleInvolved: personId ? [personId] : [] });
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
                value={flow.peopleInvolved[0] || ""}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setPersonInvolved(selectedId);
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
          <div>
            <h4>Deliverable</h4>
            <input
              type="text"
              placeholder="Deliverable"
              value={flow.deliverables[0] || ""}
              onChange={(e) => updateDeliverable(e.target.value)}
            />
          </div>
          <button onClick={() => onSave(flow, index)}>Save</button>
        </div>
      ) : (
        <div>
          <h3>{flow.title || "Untitled"}</h3>
          <p>{flow.description || "No description"}</p>
          <div>
            <h4>Person Involved</h4>
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
            <h4>Deliverable</h4>
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
