import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './BigReferralCard.css';
const { ipcRenderer } = window.require("electron");
import { FaRegWindowClose, FaEdit, FaSave} from 'react-icons/fa'; // FontAwesome icons

const BigReferralCard = ({ referral, isExpanded, updateProcessedReferralsCsv, onClose }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedReferral, setEditedReferral] = useState({
        ...referral,
    });
    const [allFlows, setAllFlows] = useState([]); // All available flows
    const [activeFlows, setActiveFlows] = useState([]); // Active flows assigned to the patient
    const [activeFlowSteps, setActiveFlowSteps] = useState([]); // Active flow steps assigned to the patient
    const [selectedFlow, setSelectedFlow] = useState(null); // Flow selected to be added
    const [activeTab, setActiveTab] = useState('current'); // State for managing tabs

    const getFlows = async () => {
        try {
            const data = await ipcRenderer.invoke("load-all-json"); // Request all JSON data
            setAllFlows(data); // Set the loaded data

            // Parse and filter active flows for the patient
            const patientActiveFlows = JSON.parse(referral.flows || "[]");
            const patientActiveFlowSteps = JSON.parse(referral.flowSteps || "[]");
            setActiveFlowSteps(patientActiveFlowSteps)
            console.log("Patient active flows:", patientActiveFlows);
            setActiveFlows(data.filter(flow => patientActiveFlows.includes(flow.data.id)));

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
        setIsEditing(!isEditing);
    };
    useEffect(() => {
        getFlows();
    }, []);

    const handleAddFlow = () => {
        if (!selectedFlow) return;

        // Add the selected flow to the active flows
        const updatedActiveFlows = [...activeFlows, selectedFlow];
        setActiveFlows(updatedActiveFlows);
        
        // Update the referral data
        const updatedFlows = updatedActiveFlows.map(flow => flow.data.id);
        setEditedReferral(prev => ({ ...prev, flows: updatedFlows }));
        const updatedFlowSteps = [...activeFlowSteps, selectedFlow.data.flows[0].id];
        console.log("Updated flow steps:", updatedFlowSteps);
        setEditedReferral(prev => ({ ...prev, flowSteps: updatedFlowSteps }));
        
        setSelectedFlow(null);
        handleSave();
    };

    const handleRemoveFlow = (flowToRemove) => {
        const updatedActiveFlows = activeFlows.filter(flow => flow.data.id !== flowToRemove.data.id);
        setActiveFlows(updatedActiveFlows);

        const updatedFlows = updatedActiveFlows.map(flow => flow.data.id);
        setEditedReferral(prev => ({ ...prev, flows: JSON.stringify(updatedFlows) }));
        handleSave();
    };

    const handleSave = () => {
        setIsEditing(false);

        const updatedColumns = {
            'Name': editedReferral.Name,
            'MRN': editedReferral.MRN,
            'One Liner': editedReferral['One Liner'],
            'Clinic Date': editedReferral['Clinic Date'],
            'EMG': editedReferral['EMG?'],
            'MRI': editedReferral['MRI?'],
            'Ultrasound': editedReferral['Ultrasound'],
            'Prelim plan/thoughts': editedReferral['Prelim plan/thoughts'],
            'flows': editedReferral.flows,
            'flowSteps': editedReferral.flowSteps,
        };

        updateProcessedReferralsCsv('referrals-legacy', referral.MRN, updatedColumns);
        updateProcessedReferralsCsv('Deidentified - referrals', referral.MRN, updatedColumns);

        console.log("Referral updated successfully");
    };

    return (
        <div className="big-referral-card">
            <div className="tabs">
                <button
                    className={activeTab === 'current' ? 'active' : ''}
                    onClick={() => setActiveTab('current')}
                >
                    Patient Info
                </button>
                <button
                    className={activeTab === 'other' ? 'active' : ''}
                    onClick={() => setActiveTab('other')}
                >
                    Flows
                </button>
                <button onClick={handleEditToggle}>{!isEditing ? <FaEdit style={{color:"#000", width:'20px', height:'20px'}} /> : <FaSave style={{color:"#000", width:'20px', height:'20px'}} />}</button>
                <button onClick={onClose}><FaRegWindowClose style={{color:"#000", width:'20px', height:'20px'}}/></button>
            </div>

            {activeTab === 'current' && (
                <div className="tab-content">
                    <div className="card-header">
                        <div><strong>Name:</strong> {isEditing ? <input value={editedReferral['Name']} onChange={(e) => handleChange('Name', e.target.value)} /> : editedReferral['Name']}</div>
                        <div><strong>MRN:</strong> {isEditing ? <input value={editedReferral['MRN']} onChange={(e) => handleChange('MRN', e.target.value)} /> : editedReferral['MRN']}</div>
                        <div><strong>One Liner:</strong> {isEditing ? <input value={editedReferral['One Liner']} onChange={(e) => handleChange('One Liner', e.target.value)} /> : editedReferral['One Liner']}</div>
                        <div><strong>Clinic Date:</strong> {isEditing ? <input value={editedReferral['Clinic Date']} onChange={(e) => handleChange('Clinic Date', e.target.value)} /> : editedReferral['Clinic Date']}</div>
                        <div><strong>EMG:</strong> {isEditing ? <input value={editedReferral['EMG?']} onChange={(e) => handleChange('EMG?', e.target.value)} /> : editedReferral['EMG?']}</div>
                        <div><strong>MRI:</strong> {isEditing ? <input value={editedReferral['MRI?']} onChange={(e) => handleChange('MRI?', e.target.value)} /> : editedReferral['MRI?']}</div>
                        <div><strong>Ultrasound:</strong> {isEditing ? <input value={editedReferral['Ultrasound']} onChange={(e) => handleChange('Ultrasound', e.target.value)} /> : editedReferral['Ultrasound']}</div>
                        <div><strong>Prelim plan/thoughts:</strong> {isEditing ? <input value={editedReferral['Prelim plan/thoughts']} onChange={(e) => handleChange('Prelim plan/thoughts', e.target.value)} /> : editedReferral['Prelim plan/thoughts']}</div>
                        {referral['user'] && <div><strong>Changed By:</strong> {referral['user']['firstName']} {referral['user']['lastName']}</div>}
                    </div>
                    <div className="card-footer">
                        {isEditing && <button onClick={handleSave}>Save</button>}
                    </div>
                </div>
            )}


            {activeTab === 'other' && (
                <div className="flows-tab">
                    <h3>Assigned Flows</h3>
                    <ul>
                        {activeFlows.map((flow, index) => (
                            <li key={index}>
                                {flow.data.title || 'Untitled'}
                                {activeFlowSteps[index] && <p>{activeFlowSteps[index]}</p>}
                            </li>
                        ))}
                    </ul>

                    <h3>Add a Flow</h3>
                    <select
                        value={selectedFlow ? selectedFlow.data.id : ''}
                        onChange={(e) => {
                            console.log(e.target.value);
                            const flow = allFlows.find(flow => flow.data.id == e.target.value);
                            console.log(allFlows.map(flow => flow.data.id));
                            console.log("Selected flow:", flow);
                            setSelectedFlow(flow || null);
                        }}
                    >
                        <option value="">Select a flow</option>
                        {allFlows.filter(flow => ! activeFlows.map(flow => flow.data.id).includes(flow.data.id)).map((flow, index) => (
                            <option key={index} value={flow.data.id}>
                                {flow.data.title || 'Untitled'}
                                {activeFlowSteps[index] && <p>{activeFlowSteps[index]}</p>}
                            </option>
                        ))}
                    </select>
                    <button onClick={handleAddFlow} disabled={!selectedFlow}>
                        Add Flow
                    </button>
                    <div className="card-footer">
                        <button onClick={handleEditToggle}>{isEditing ? 'Cancel' : 'Edit'}</button>
                        <button onClick={handleSave}>Save</button>
                    </div>
                </div>
            )}
        </div>
    );
};

BigReferralCard.propTypes = {
    referral: PropTypes.object.isRequired,
    updateProcessedReferralsCsv: PropTypes.func.isRequired,
};

export default BigReferralCard;
