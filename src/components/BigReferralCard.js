import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './BigReferralCard.css';
import LittleFlowCard from './flowCards/LittleFlowCard';'../components/flowCards/LittleFlowCard';
const { ipcRenderer } = window.require("electron");
import { FaRegWindowClose, FaEdit, FaSave, FaTrash} from 'react-icons/fa'; // FontAwesome icons
const { updateCSVRow } = require('../../data-preprocessing/updateCSVRow');

const BigReferralCard = ({ referral, setChangelog,changelog, onClose, refresh, handleDeletePatient, userProfile}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedReferral, setEditedReferral] = useState({
        ...referral,
    });
    const [allFlows, setAllFlows] = useState([]); // All available flows
    const [activeFlows, setActiveFlows] = useState([]); // Active flows assigned to the patient
    const [selectedFlow, setSelectedFlow] = useState(null); // Flow selected to be added
    const [activeTab, setActiveTab] = useState('current'); // State for managing tabs
    const [allPatientFlows, setAllPatientFlows] = useState({})
    const [showConfirmation, setShowConfirmation] = useState(false); // Confirmation modal state
    
    const getFlows = async () => {
        try {
            const data = await ipcRenderer.invoke("load-all-json"); // Request all JSON data
            const allActivePatientFlows = await ipcRenderer.invoke("load-active-patient-flows"); // Request all JSON data
            setAllPatientFlows(allActivePatientFlows)
            // const curentPatientActiveFlows = allActivePatientFlows[referral.mrn]
            setAllFlows(data); // all flows that exists for the organization 
            if (referral.MRN in allActivePatientFlows) setActiveFlows(allActivePatientFlows[referral.MRN]); 
            console.log("active FLows",allActivePatientFlows[referral.MRN] )
        } catch (err) {
            console.error("Error loading JSON data:", err.message);
        }
    };

    const handleChange = (field, value) => {
        setEditedReferral(prevState => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handleEditToggle = () => {
        if(isEditing){
            handleSave();
        }
        setIsEditing(!isEditing);
    };

    useEffect(() => {
        getFlows();
    }, [isEditing]);

    const confirmDelete = () => {
        handleDeletePatient(referral.MRN); // Call the delete handler
        setShowConfirmation(false); // Hide the modal
    };
    
    const handleAddFlow = () => {
        // this needs updating... 
        if (!selectedFlow) return;
        if (referral.MRN in allPatientFlows){
            if (allPatientFlows[referral.MRN].find(flow => flow.data.id === selectedFlow.data.id)) return;
            let newFlow = {...allPatientFlows}
            newFlow[referral.MRN].push(selectedFlow)
            window.electron.saveJsonFile('patient-flows.json', newFlow);
        } else {
            let newFlow = {...allPatientFlows}
            newFlow[referral.MRN] = [selectedFlow]
            console.log("New FLow", newFlow)
            window.electron.saveJsonFile('patient-flows.json', newFlow);
        }
        
        // update the changelog
        const date = new Date().toISOString();
        const changes = {
                Date: date,
                editor: userProfile._id,
                MRN: referral['MRN'],
                field: 'flows',
                old_value: null,
                new_value: selectedFlow,
                action: 'Flow Added'
            }
        setChangelog([...changelog, changes]);
        window.electron.saveCsvFile('changelog.csv', [...changelog, changes]);
        
        refresh(); 
        getFlows();
    };

    const handleSaveFlow = (flowToSave) => {
        console.log('Saving flow:', flowToSave);
        let newFlows = {...allPatientFlows}
        let currrentPatientFlows = newFlows[referral.MRN]
        let updatedCurrentPatientFlows = currrentPatientFlows.map(flow => flow.data.id === flowToSave.id ? {...flow, data: flowToSave} : flow);
        newFlows[referral.MRN] = updatedCurrentPatientFlows

        window.electron.saveJsonFile('patient-flows.json', newFlows);

        // update the changelog 
        const date = new Date().toISOString();
        const changes = [
            {
                Date: date,
                editor: userProfile._id,
                MRN: referral['MRN'],
                field: 'flows',
                old_value: flowToSave,
                new_value: flowToSave,
                action: 'Flow Updated'
            }
        ]
        setChangelog([...changelog, ...changes]);
        window.electron.saveCsvFile('changelog.csv', [...changelog, ...changes]);

        setActiveFlows(newFlows[referral.MRN]);
        getFlows(); // update the flows so they automatically update
    }

    const handleRemoveFlow = (flowToRemove) => {
        let newFlows = {...allPatientFlows}
        let currrentPatientFlows = newFlows[referral.MRN]
        let updatedCurrentPatientFlows = currrentPatientFlows.filter(flow => flow.data.id !== flowToRemove.id);
        newFlows[referral.MRN] = updatedCurrentPatientFlows
        window.electron.saveJsonFile('patient-flows.json', newFlows);

        // update the changelog
        const date = new Date().toISOString();
        const changes = [
            {
                Date: date,
                editor: userProfile._id,
                MRN: referral['MRN'],
                field: 'flows',
                old_value: flowToRemove,
                new_value: null,
                action: 'Flow Removed'
            }
        ]
        setChangelog([...changelog, ...changes]);
        window.electron.saveCsvFile('changelog.csv', [...changelog, ...changes]);

        setActiveFlows(newFlows[referral.MRN]);
        getFlows(); // update the flows so they automatically


    };

    const handleSave = () => {
        setIsEditing(false);
    
        const updatedColumns = { ...editedReferral }; // Dynamically capture all keys and values from editedReferral
        updateCSVRow('patients', referral.MRN, updatedColumns);


        const date = new Date().toISOString();
        console.log("UPPPPP Profile", userProfile._id)
        const changes = [
            ...Object.entries(editedReferral).map(([key, value]) => {
                if (editedReferral[key] !== referral[key]) return {
                    Date: date,
                    editor: userProfile._id,
                    MRN: referral['MRN'],
                    field: key,
                    old_value: referral[key],
                    new_value: value,
                    action: 'Patient Updated'
                };
                return null;
            }).filter(change => change !== null)
        ]
        setChangelog([...changelog, ...changes]);
        window.electron.saveCsvFile('changelog.csv', [...changelog, ...changes]);
    
        console.log("Referral updated successfully");
        refresh();
    };

    return (
        <div className="big-referral-card">
            <div className="tabs">
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <button
                        className={`tab-button ${activeTab === 'current' ? 'active' : ''}`}
                        onClick={() => setActiveTab('current')}
                    >
                        Patient Info
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'other' ? 'active' : ''}`}
                        onClick={() => setActiveTab('other')}
                    >
                        Flows
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    {activeTab === 'current' && (
                        <div onClick={handleEditToggle} style={{padding: '10px'}}>
                            {!isEditing ? (
                                <FaEdit style={{ color: "#FFF", width: '20px', height: '20px' }} />
                            ) : (
                                <FaSave style={{ color: "#FFF", width: '20px', height: '20px' }} />
                            )}
                        </div>
                    )}
                    <div onClick={onClose}  style={{padding: '10px'}}>
                        <FaRegWindowClose style={{ color: "#FFF", width: '20px', height: '20px' }} />
                    </div>
                </div>
            </div>

            {activeTab === 'current' && (
                <div className="current-tab">
                    <div className="referral-details">
                        {Object.keys(editedReferral).map((key) => (
                            <div className="referral-detail-row" key={key}>
                                <strong className="detail-key">{key}:</strong>
                                {isEditing ? (
                                    <input
                                        className="detail-input"
                                        value={editedReferral[key] || ''}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                    />
                                ) : (
                                    <span className="detail-value">{editedReferral[key]}</span>
                                )}
                            </div>
                        ))}
                    </div>
                    {isEditing && (
                        <div className="delete-button-container">
                            <button
                                onClick={() => setShowConfirmation(true)} // Open the modal
                                style={{
                                    marginTop: '20px',
                                    backgroundColor: '#ED7390',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                }}
                            >
                                Delete Patient
                            </button>
                        </div>
                    )}
    
                </div>
            )}

            {activeTab === 'other' && (
                <div className="flows-tab">
                    <div className="active-flows">
                        {activeFlows.length > 0 ? (
                            activeFlows.map((flow, index) => (
                                <div key={index} className="flow-card">
                                    <LittleFlowCard
                                        flow={flow.data}
                                        onRemove={handleRemoveFlow}
                                        onSave={handleSaveFlow}
                                        onDelete={handleRemoveFlow}
                                    />
                                </div>
                            ))
                        ) : (
                            <p>No active flows for this patient.</p>
                        )}
                    </div>

                    <div className="add-flow-section">
                        {allFlows.filter(flow => !activeFlows.some(active => active.data.id === flow.data.id)).length > 0 && (
                            <>
                                <h3>Add a New Flow</h3>
                                <div className="add-flow-controls">
                                    <select
                                        value={selectedFlow ? selectedFlow.data.id : ''}
                                        onChange={(e) => {
                                            const flow = allFlows.find(flow => flow.data.id == e.target.value);
                                            setSelectedFlow(flow || null);
                                        }}
                                        className="flow-select"
                                    >
                                        <option value="">Select a flow</option>
                                        {allFlows.filter(flow => !activeFlows.some(active => active.data.id === flow.data.id)).map((flow, index) => (
                                            <option key={index} value={flow.data.id}>
                                                {flow.data.title || 'Untitled'}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        className="add-flow-btn"
                                        onClick={handleAddFlow}
                                        disabled={!selectedFlow}
                                    >
                                        Add Flow
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            {showConfirmation && (
                <div className="confirmation-modal">
                    <div className="modal-content">
                        <h2>Are you sure?</h2>
                        <p>Deleting this patient is irreversible.</p>
                        <div className="modal-actions">
                            <button
                                onClick={() => setShowConfirmation(false)} // Hide modal if "Cancel" is clicked
                                style={{
                                    marginRight: '10px',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete} // Proceed with deletion if "Confirm" is clicked
                                style={{
                                    backgroundColor: '#ED7390',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
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

export default BigReferralCard;
