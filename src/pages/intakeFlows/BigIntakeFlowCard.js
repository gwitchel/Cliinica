import React, { useState } from 'react';
import "./BigIntakeFlowCard.css";

const BigIntakeFlowCard = ({ flow, onDelete, organization }) => {
  const [showModal, setShowModal] = useState(false);
  const [userInput, setUserInput] = useState('');
    console.log('organization', organization)
  const handleDeleteClick = () => {
    setShowModal(true); // Show the modal when delete button is clicked
  };

  const confirmDelete = () => {
    // Trim whitespace from both the user input and the flow title
    const trimmedUserInput = userInput.trim();
    const trimmedFlowTitle = flow.data.title.trim();

    if (trimmedUserInput === trimmedFlowTitle) {
        onDelete(flow); // Call the delete function if confirmed
        setShowModal(false); // Close the modal
    } else {
        alert('Flow name did not match. Deletion canceled.');
    }
  };

  const getPersonName = (personId) => {
    const person = organization.find((orgPerson) => orgPerson._id === personId);
    return person
      ? `${person.firstName} ${person.lastName}`
      : 'Unknown';
  };

  const cancelDelete = () => {
    setShowModal(false); // Close the modal without deleting
    setUserInput(''); // Reset user input
  };

  return (
    <div style={{}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>{flow.data.title}</h1>
        <button
          onClick={handleDeleteClick}
          style={{
            borderRadius: '16px',
            borderWidth: '1px',
            borderColor: "#fff"
          }}
        >
          Delete Flow
        </button>
      </div>
      <div className="flow-step-title" style={{ margin: '10px 0' }}>{flow.data.description}</div>

      <div>
        {flow.data.flows.map((sequence, seqIndex) => (
          <div key={seqIndex} style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                flexDirection: sequence.length > 1 ? 'row' : 'column',
              }}
            >
              {sequence.map((step, stepIndex) => (
                <div
                  key={stepIndex}
                  className='inner-card'
                >
                  <div className="flow-step-title">{step.title || `Step ${stepIndex + 1}`}</div>
                  <div className="flow-step-title">{step.description}</div>
                  <div className="flow-step-title" style={{margin:0}}> Deliverable</div>
                  
                  <div>
                    {step.deliverables.length > 0 ? (
                    step.deliverables.map((deliverable, i) => <div className="flow-step-title">{deliverable}</div>)
                    ) : (
                    <div className="flow-step-title">No deliverables</div>
                    )}
                  </div>
                  <div>
                    <div style={{margin:0, marginTop: '16px'}} className="flow-step-title"> Person</div>
                    {step.peopleInvolved.length > 0 ? (
                    step.peopleInvolved.map((personId, i) => (
                        <div className="flow-step-title"> {getPersonName(personId)} </div>
                    ))
                    ) : (
                    <li>No one assigned</li>
                    )}
                
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            className='confirm-delete-module'
          >
            <h2>Are you sure you want to delete "{flow.data.title}"</h2>
            <div className='confirm-delete-text'>Deleting a flow will not delete the flow from patients for which is has already been assigned, it will just prevent you from 
                viewing the flow or adding additional patients to the flow. If you'd like to remove this flow from a single patient
                you can do so from the patients tab. </div>
            <input
              type="text"
              value={userInput}
              placeholder='enter flow title to delete'
              onChange={(e) => setUserInput(e.target.value)}
              style={{
                flexGrow: 1,
                padding: '10px',
                margin: '10px 0',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={cancelDelete}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  padding: '10px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  flex: 1,
                  marginRight: '10px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  backgroundColor: '#ED7390',
                  color: 'white',
                  padding: '10px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  flex: 1,
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BigIntakeFlowCard;
