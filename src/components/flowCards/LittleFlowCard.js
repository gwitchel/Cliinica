import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './LittleFlowCard.css';
import PersonPill from '../PeopleCards/PersonPill';
import { FaEdit, FaSave, FaTrash} from 'react-icons/fa'; // FontAwesome icons

const { ipcRenderer } = window.require("electron");

const LittleFlowCard = ({ flow, onSave, onDelete}) => {
    const [people, setPeople] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [localFlow, setLocalFlow] = useState({ ...flow }); // Local copy of the flow
    console.log("FLOWWTYTTT", flow)

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

    const toggleEdit = () => {
        setIsEditing((prev) => !prev);

        if (!isEditing && JSON.stringify(localFlow) !== JSON.stringify(flow)) {
            handleSave();
        }
    };

    const handleCheckboxChange = (flowId, isChecked) => {
        console.log("flowId", flowId)

        const updatedFlows = localFlow.flows.map((flowRow) =>
            flowRow.map((item) =>
                item.id === flowId
                    ? { ...item, isCompleted: isChecked, updatedAt: new Date().toISOString() }
                    : item
            )
        );
        setLocalFlow({ ...localFlow, flows: updatedFlows });
    };

    const handleCommentChange = (flowId, comment) => {
        const updatedFlows = localFlow.flows.map((flowRow) =>
            flowRow.map((item) =>
                item.id === flowId
                    ? { ...item, comments: comment, updatedAt: new Date().toISOString() }
                    : item
            )
        );
        setLocalFlow({ ...localFlow, flows: updatedFlows });
    };

    const handleSave = () => {
        onSave(localFlow); // Save the updated flow
        setIsEditing(false); // Exit editing mode
    };

    return (
        <div className="little-flow-card">
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <h3>{flow.title}</h3>
                <div style={{ display: 'flex', flexDirection: 'row',}}>
                <button onClick={toggleEdit}>
                    {!isEditing ? (
                        <FaEdit style={{ color: '#000', width: '20px', height: '20px' }} />
                    ) : (
                        <FaSave style={{ color: '#000', width: '20px', height: '20px' }} />
                    )}
                </button>
                {isEditing && (<button onClick={()=>onDelete(flow)}><FaTrash/></button>)}
                </div>
            </div>
            <div className='little-flow-card-row'>
                {localFlow.flows.map((flowRow, index) =>
                    flowRow.map((item, index) => (
                        <div
                            className={flow.isCompleted ? 'little-flow-card-completed' : 'little-flow-card-future'}
                            key={index}
                        >
                            {/* <h4>{item.title}</h4> */}
                            <p>{item.description}</p>
                            {people
                                .filter((person) => item.peopleInvolved.includes(person._id))
                                .map((person) => (
                                    <PersonPill key={person._id} person={person} />
                                ))}
                            {item.deliverables.map((deliverable, idx) => (
                                <div key={idx}>{deliverable}</div>
                            ))}
                            {isEditing && (
                                <div>
                                    <label style={{ display: 'block', marginTop: '10px' }}>
                                        <input
                                            type="checkbox"
                                            checked={item.isCompleted || false}
                                            onChange={(e) =>
                                                handleCheckboxChange(item.id, e.target.checked)
                                            }
                                        />
                                        Completed
                                    </label>
                                    <textarea
                                        style={{ width: '100%', marginTop: '10px' }}
                                        placeholder="Add comments here..."
                                        value={item.comments || ''}
                                        onChange={(e) =>
                                            handleCommentChange(item.id, e.target.value)
                                        }
                                    />
                                </div>
                            )}
                            {item.comments && (
                                <p style={{ fontSize: '12px'}}>
                                    Comments: {item.comments}
                                </p>
                            )}
                            {item.updatedAt && (
                                <p style={{ fontSize: '12px', color: 'gray', marginTop: '10px' }}>
                                    Last updated: {new Date(item.updatedAt).toLocaleString()}
                                </p>
                            )}
                           

                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LittleFlowCard;
