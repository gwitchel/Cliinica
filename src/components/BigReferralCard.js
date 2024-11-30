import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './BigReferralCard.css';
import LittleFlowCard from './flowCards/LittleFlowCard';'../components/flowCards/LittleFlowCard';
const { ipcRenderer } = window.require("electron");
import { FaRegWindowClose, FaEdit, FaSave, FaTrash} from 'react-icons/fa'; // FontAwesome icons
import { deleteCSVRow } from '../../data-preprocessing/updateCSVRow';

const BigReferralCard = ({ referral, isExpanded, updateProcessedReferralsCsv, onClose, refresh}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedReferral, setEditedReferral] = useState({
        ...referral,
    });
    const [allFlows, setAllFlows] = useState([]); // All available flows
    const [activeFlows, setActiveFlows] = useState([]); // Active flows assigned to the patient
    const [selectedFlow, setSelectedFlow] = useState(null); // Flow selected to be added
    const [activeTab, setActiveTab] = useState('current'); // State for managing tabs
    const [allPatientFlows, setAllPatientFlows] = useState({})
    
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
        refresh(); 
        getFlows();
    };

    const handleSaveFlow = (flowToSave) => {
        let newFlows = {...allPatientFlows}
        let currrentPatientFlows = newFlows[referral.MRN]
        console.log("Flow to save", flowToSave)
        console.log("Current Patient Flows", currrentPatientFlows)
        let updatedCurrentPatientFlows = currrentPatientFlows.map(flow => flow.data.id === flowToSave.id ? {...flow, data: flowToSave} : flow);
        newFlows[referral.MRN] = updatedCurrentPatientFlows
        // const updatedActiveFlows = activeFlows.map(flow => flow.data.id === flowToSave.id ? flowToSave : flow);
        window.electron.saveJsonFile('patient-flows.json', newFlows);
        setActiveFlows(newFlows[referral.MRN]);
        getFlows(); // update the flows so they automatically update
    }

    const handleRemoveFlow = (flowToRemove) => {
        let newFlows = {...allPatientFlows}
        let currrentPatientFlows = newFlows[referral.MRN]
        let updatedCurrentPatientFlows = currrentPatientFlows.filter(flow => flow.data.id !== flowToRemove.id);
        newFlows[referral.MRN] = updatedCurrentPatientFlows
        window.electron.saveJsonFile('patient-flows.json', newFlows);
        setActiveFlows(newFlows[referral.MRN]);
        getFlows(); // update the flows so they automatically
    };

    const handleDeletePatient = () => {
        console.log('Deleting patient:', referral);
        const updatedReferrals = referrals.filter(referral => referral.MRN !== referral.MRN);
        setReferrals(updatedReferrals);

        setSelectedReferral(null);
        refresh();
    };
    
    const handleSave = () => {
        setIsEditing(false);
    
        const updatedColumns = { ...editedReferral }; // Dynamically capture all keys and values from editedReferral
    
        console.log("Updated columns:", updatedColumns);
        updateProcessedReferralsCsv('patients', referral.MRN, updatedColumns);
        // updateProcessedReferralsCsv('Deidentified - referrals', referral.MRN, updatedColumns);
    
        console.log("Referral updated successfully");
        refresh(); // Refresh the referral list
    };

    return (
        <div className="big-referral-card">
            <div className="tabs">
                <div style={{display:'flex', flexDirection:'row'}}>
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
                </div>
                <div style={{display:'flex', flexDirection:'row'}}>
                    {activeTab === 'current' &&
                    <button onClick={handleEditToggle}>{!isEditing ? <FaEdit style={{color:"#000", width:'20px', height:'20px'}} /> : <FaSave style={{color:"#000", width:'20px', height:'20px'}} />}</button>
                    } 
                    {/* Right now you can only delete patients by editing the CSV file its referring to */}
                    {/* {isEditing && <button onClick={()=>{deleteCSVRow('patients', referral.MRN), onClose() }}><FaTrash style={{color:"#000", width:'20px', height:'20px'}}/></button>} */}
                    <button onClick={onClose}><FaRegWindowClose style={{color:"#000", width:'20px', height:'20px'}}/></button>
                </div>
            </div>

            {activeTab === 'current' && (
                <div className="tab-content">
                    <div className="card-header">
                        {Object.keys(editedReferral).map((key) => (
                            <div key={key}>
                                <strong>{key}:</strong>{' '}
                                {isEditing ? (
                                    <input
                                        value={editedReferral[key] || ''}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                    />
                                ) : (
                                    editedReferral[key]
                                )}
                            </div>
                        ))}
                        {/* {referral['user'] && (
                            <div>
                                <strong>Changed By:</strong> {referral['user']['firstName']} {referral['user']['lastName']}
                            </div>
                        )} */}
                    </div>
                </div>
            )}


            {activeTab === 'other' && (
                <div className="flows-tab">
                    <div >
                        {activeFlows.map((flow, index) => (
                            <>
                            {isEditing && <button  key={index} onClick={() => handleRemoveFlow(flow)}>Remove</button>}
                            <LittleFlowCard 
                                key={index} 
                                flow={flow.data} 
                                onRemove={handleRemoveFlow} 
                                onSave={handleSaveFlow} 
                                onDelete={handleRemoveFlow}
                            />
                            </>
                        ))}
                    </div>

                    
                    {allFlows.filter(flow => !activeFlows.map(flow => flow.data.id).includes(flow.data.id)).length != 0 && <>
                        <h3>Add a Flow</h3>
                        <select
                            value={selectedFlow ? selectedFlow.data.id : ''}
                            onChange={(e) => {
                                const flow = allFlows.find(flow => flow.data.id == e.target.value);
                                setSelectedFlow(flow || null);
                            }}
                        >
                            <option value="">Select a flow</option>
                            {allFlows.filter(flow => !activeFlows.map(flow => flow.data.id).includes(flow.data.id)).map((flow, index) => (
                                <option key={index} value={flow.data.id}>
                                    {flow.data.title || 'Untitled'}
                                </option>
                            ))}
                        </select>
                        <button onClick={handleAddFlow} disabled={!selectedFlow}>
                            Add Flow
                        </button>
                    </>}
                
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
