import React, { useState, useEffect } from 'react';
import './Organization.css';
import { FaEdit, FaSave } from 'react-icons/fa';

const Organization = () => {
    const [organizations, setOrganizations] = useState([]);
    const [profile, setProfile] = useState(null);
    const [newMember, setNewMember] = useState({ firstName: '', lastName: '', role: '' });
    const [editingIndex, setEditingIndex] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);
    
    const loadProfile = async () => {
        try {
            const profileData = await window.electron.loadUserProfile();
            setProfile(profileData);
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    };

    const loadOrganizations = async () => {
        try {
            const processedData = await window.electron.loadCsv('organization');
            setOrganizations(processedData);
        } catch (error) {
            console.error('Error loading organizations data:', error);
        }
    };

    useEffect(() => {
        loadOrganizations();
        loadProfile();
    }, []);

    const handleAddMember = () => {
        if (newMember.firstName && newMember.lastName && newMember.role) {
            const newMemberId = Date.now();
            // setOrganizations([...organizations, { _id: newMemberId, ...newMember }]);
            window.electron.saveCsvFile('organization.csv', [...organizations, { _id: newMemberId, ...newMember }]);
            console.log([...organizations, { _id: newMemberId, ...newMember }]);

            setNewMember({ firstName: '', lastName: '', role: '' });
            loadOrganizations();
        } else {
            alert('Please fill out all fields.');
        }
    };

    const handleDeleteMember = (indexToRemove) => {
        if (organizations.length > 1) {
            setOrganizations(organizations.filter((_, index) => index !== indexToRemove));
            window.electron.saveCsvFile('organization.csv', organizations.filter((_, index) => index !== indexToRemove));
        } else {
            alert('Organization must have at least one member.');
        }
    };

    const handleEditMember = (index) => {
        setEditingIndex(index);
    };

    const handleSaveInlineEdit = (index) => {
        const updatedOrganizations = [...organizations];
        setOrganizations(updatedOrganizations);
        setEditingIndex(null);
        window.electron.saveCsvFile('organization.csv', updatedOrganizations);

        // Update profile if the active user was edited
        if (profile && organizations[index]._id === profile._id) {
            window.electron.saveJsonFile('user-profile.json', updatedOrganizations[index]);
        }
        loadOrganizations();
    };

    const confirmDeleteMember = () => {
        if (memberToDelete !== null) {
            handleDeleteMember(memberToDelete); // Call the existing delete logic
            setShowDeleteConfirmation(false); // Hide the modal
            setMemberToDelete(null); // Clear the member index
        }
    };

    const cancelDeleteMember = () => {
        setShowDeleteConfirmation(false); // Hide the modal
        setMemberToDelete(null); // Clear the member index
    };

    const handleFieldChange = (index, field, value) => {
        const updatedOrganizations = [...organizations];
        updatedOrganizations[index][field] = value;
        setOrganizations(updatedOrganizations);
    };

    const toggleEditMode = () => {
        if (isEditMode) {
            window.electron.saveCsvFile('organization.csv', organizations);
            loadOrganizations();
        }
        setIsEditMode(!isEditMode);
    };

    return (
        <div className="organization-container">
            {isEditMode && (
                <div className="add-member-form">
                    <h2>Add New Member</h2>
                    <input
                        type="text"
                        placeholder="First Name"
                        value={newMember.firstName}
                        onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Last Name"
                        value={newMember.lastName}
                        onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Role"
                        value={newMember.role}
                        onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    />
                    <button onClick={handleAddMember}>Add Member</button>
                </div>
            )}

            <div className="org-cards">
                {organizations.length ? (
                    organizations.map((organization, index) => (
                        <div
                            key={index}
                            className={`org-card ${
                                profile && organization._id === profile._id ? 'active-user' : ''
                            }`}
                        >
                            {editingIndex === index ? (
                                <>
                                    <input
                                        type="text"
                                        value={organization.firstName}
                                        onChange={(e) => handleFieldChange(index, 'firstName', e.target.value)}
                                        disabled={profile && organization._id === profile._id}
                                    />
                                    <input
                                        type="text"
                                        value={organization.lastName}
                                        onChange={(e) => handleFieldChange(index, 'lastName', e.target.value)}
                                        disabled={profile && organization._id === profile._id}
                                    />
                                    <input
                                        type="text"
                                        value={organization.role}
                                        onChange={(e) => handleFieldChange(index, 'role', e.target.value)}
                                        disabled={profile && organization._id === profile._id}
                                    />
                                    <button onClick={() => handleSaveInlineEdit(index)}>Save</button>
                                    <button onClick={() => setEditingIndex(null)}>Cancel</button>
                                </>
                            ) : (
                                <>
                                    <h2>{organization.firstName} {organization.lastName}</h2>
                                    <p>{organization.role}</p>
                                    {isEditMode && profile && organization._id !== profile._id && (
                                        <>
                                            <button onClick={() => handleEditMember(index)}>Edit</button>
                                            <button
                                                onClick={() => {
                                                    setShowDeleteConfirmation(true); // Show the modal
                                                    setMemberToDelete(index); // Store the index of the member to delete
                                                }}
                                                disabled={organizations.length === 1}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    ))
                ) : (
                    'Loading organizations...'
                )}
            </div>

            <button className="toggle-mode-btn static-edit-btn" onClick={toggleEditMode}>
                {isEditMode ? <FaSave style={{ width: '20px', height: '20px' }} /> : <FaEdit style={{ width: '20px', height: '20px' }} />}
            </button>

            {showDeleteConfirmation && (
                <div className="delete-confirmation-modal">
                    <div className="modal-content">
                        <h2>Are you sure?</h2>
                        <p>
                            Deleting this member is irreversible.
                             Any flow steps which they are responsible for will have 
                             NO ONE TRACKING THEM and will be effectivly lost in the system
                        </p>
                        <div className="modal-actions">
                            <button
                                onClick={cancelDeleteMember}
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
                                onClick={confirmDeleteMember}
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

export default Organization;
