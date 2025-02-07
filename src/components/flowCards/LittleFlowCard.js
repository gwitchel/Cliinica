import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './LittleFlowCard.css';
import PersonPill from '../PeopleCards/PersonPill';
import { FaEdit, FaSave, FaTrash } from 'react-icons/fa';

const { ipcRenderer } = window.require("electron");

const LittleFlowCard = ({ flow, onSave, onDelete }) => {
    const [people, setPeople] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [localFlow, setLocalFlow] = useState({ ...flow });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // State for delete confirmation

    useEffect(() => {
        const loadOrganizations = async () => {
            try {
                const processedData = await window.electron.loadCsv('organization');
                setPeople(processedData);
            } catch (error) {
                console.error('Error loading organizations data:', error);
            }
        };

        loadOrganizations();
    }, []);

    const toggleEdit = () => {
        if (isEditing && JSON.stringify(localFlow) !== JSON.stringify(flow)) {
            onSave(localFlow);
        }
        setIsEditing((prev) => !prev);
    };


    const handleCheckboxChange = (flowId, isChecked) => {
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

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true); // Show the confirmation popup
    };

    const confirmDelete = () => {
        onDelete(flow); // Perform the delete action
        setShowDeleteConfirm(false); // Close the popup
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false); // Close the popup without deleting
    };

    return (
        <div className="little-flow-card">
            <div className="little-flow-card-header">
                <h3>{flow.title}</h3>
                <div className="action-buttons">
                    <button onClick={toggleEdit} className="icon-button">
                        {!isEditing ? <FaEdit style={{color: '#fff'}}/> : <FaSave style={{color: '#fff'}}/>}
                    </button>
                </div>
            </div>
            <div className="little-flow-card-content">
                {localFlow.flows.map((flowRow, rowIndex) => (
                    <div key={rowIndex} className="flow-row">
                            {flowRow.map((item, itemIndex) => (
                                <div
                                    className={`little-flow-step ${item.isCompleted ? 'completed' : 'pending'}`}
                                    key={itemIndex}
                                >
                                    <h5 style={{margin:0}} >{item.title}</h5>
                                    <p>{item.description}</p>
                                    <div className="people-section">
                                        {people
                                            .filter((person) => item.peopleInvolved.includes(person._id))
                                            .map((person) => (
                                                <PersonPill key={person._id} person={person} />
                                            ))}
                                    </div>
                                    <div className="deliverables-section">
                                        {item.deliverables.map((deliverable, idx) => (
                                            <div key={idx} className="deliverable">
                                                {deliverable}
                                            </div>
                                        ))}
                                    </div>
                                    {isEditing && (
                                        <div className="edit-section">
                                            <label>
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
                                                className="comments-input"
                                                placeholder="Add comments here..."
                                                value={item.comments || ''}
                                                onChange={(e) =>
                                                    handleCommentChange(item.id, e.target.value)
                                                }
                                            />
                                        </div>
                                    )}
                                    {item.comments && <p className="comments">Comments: {item.comments}</p>}
                                    {item.updatedAt && (
                                        <p className="last-updated">
                                            Last updated: {new Date(item.updatedAt).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            ))}
                    </div>
                ))}
            </div>
            {isEditing && (
                <button onClick={handleDeleteClick} className="icon-button">
                    <FaTrash style={{marginTop: '8px'}}/>
                </button>
            )}
            {showDeleteConfirm && (
                <div className="delete-confirm-overlay">
                    <div className="delete-confirm-popup">
                        <h4>Are you sure you want to delete this flow?</h4>
                        <p> this will remove the patients entire history in this flow and cannot be undone</p>
                        <div className="delete-confirm-buttons">
                            <button onClick={confirmDelete} className="confirm-button">
                                Confirm
                            </button>
                            <button onClick={cancelDelete} className="cancel-button">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

LittleFlowCard.propTypes = {
    flow: PropTypes.object.isRequired,
    onSave: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};

export default LittleFlowCard;
