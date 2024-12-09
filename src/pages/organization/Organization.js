import React, { useState, useEffect } from 'react';
import './Organization.css';
import { FaEdit, FaSave } from 'react-icons/fa';

const Organization = ({userProfile}) => {
    const [organizations, setOrganizations] = useState([]);
    const [newMember, setNewMember] = useState({ firstName: '', lastName: '', role: '' });
    const [editingIndex, setEditingIndex] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);


    const loadOrganizations = async () => {
        try {
            const processedData = await window.electron.loadCsv('organization');
            setOrganizations(processedData);
            console.log("CHECKING", userProfile);
            console.log("FFFF", userProfile._id);
            console.log("CHECKING", processedData.map((row) => row._id +"---"+ userProfile._id));
        } catch (error) {
            console.error('Error loading organizations data:', error);
        }
    };

    useEffect(() => {
        loadOrganizations();
    }, []);

    const handleAddMember = () => {
        if (newMember.firstName && newMember.lastName && newMember.role) {
            const newMemberId = Date.now();
            // setOrganizations([...organizations, { _id: newMemberId, ...newMember }]);
            window.electron.saveCsvFile('organization.csv', [...organizations, { _id: newMemberId, ...newMember }]);
            console.log([...organizations, { _id: newMemberId, ...newMember }]);

            setNewMember({ firstName: '', lastName: '', role: '', username: '', password: '', isAdmin: false });
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

        // Update userProfile if the active user was edited
        if (userProfile && organizations[index]._id === userProfile._id) {
            window.electron.saveJsonFile('user-userProfile.json', updatedOrganizations[index]);
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
            handleSaveInlineEdit(editingIndex);
            window.electron.saveCsvFile('organization.csv', organizations);
            loadOrganizations();

        }
        setIsEditMode(!isEditMode);
    };

    return (
        <div className="organization-container">
            {isEditMode && (
                <div style={{display:'flex', flexDirection:'column'}}>
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
                    <input
                        type="text"
                        placeholder="username"
                        value={newMember.username}
                        onChange={(e) => setNewMember({ ...newMember, username: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="password"
                        value={newMember.password}
                        onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                    />
                    <div className="switch-container">
                    Admin Privileges
                    <input
                        type="checkbox"
                        checked={newMember.isAdmin}
                        onChange={(e) => setNewMember({ ...newMember, isAdmin: e.target.checked })}
                        style={{ marginLeft: '8px' }}
                    />
                    </div>
                    <button className='add-member-form-btn' onClick={handleAddMember}>Add Member</button>
                </div>
            )}

            <div className="org-cards">
                {organizations.length ? (
                    organizations.map((organization, index) => (
                        <div
                            key={index}
                            className={`org-card ${
                                organization._id == userProfile._id ? 'active-user' : ''
                            }`}
                        >
                            {editingIndex == index ? (
                                <div style={{display:'flex', flexDirection:'column'}}>
                                    <input
                                        type="text"
                                        value={organization.firstName}
                                        onChange={(e) => handleFieldChange(index, 'firstName', e.target.value)}
                                        disabled={organization._id == userProfile._id}
                                    />
                                    <input
                                        type="text"
                                        value={organization.lastName}
                                        onChange={(e) => handleFieldChange(index, 'lastName', e.target.value)}
                                        disabled={organization._id == userProfile._id}
                                    />
                                    <input
                                        type="text"
                                        value={organization.role}
                                        onChange={(e) => handleFieldChange(index, 'role', e.target.value)}
                                        disabled={organization._id == userProfile._id}
                                    />
                                    <label>password</label>
                                    <input
                                        type="text"
                                        placeholder="username"
                                        value={organization.username}
                                        onChange={(e) => setNewMember({ ...newMember, username: e.target.value })}
                                        disabled={organization._id == userProfile._id}
                                    />
                                    <label>password</label>
                                    <input
                                        type="text"
                                        placeholder="password"
                                        value={organization.password}
                                        onChange={(e) => handleFieldChange(index, 'password', e.target.value)}
                                        disabled={organization._id == userProfile._id}
                                    />
                                    <div className="switch-container">
                                        Admin Privileges
                                    <input
                                        type="checkbox"
                                        checked={organization.isAdmin}
                                        onChange={(e) => handleFieldChange(index, 'isAdmin', e.target.checked)}
                                        style={{ marginLeft: '8px' }}
                                        disabled={organization._id == userProfile._id}
                                    />
                                    </div>
                                    <button onClick={() => handleSaveInlineEdit(index)}>Save</button>
                                    <button onClick={() => setEditingIndex(null)}>Cancel</button>
                                </div>
                            ) : (
                                <>
                                    <h2>{organization.firstName} {organization.lastName}</h2>
                                    <p>{organization.role}</p>
                                    {isEditMode && organization._id !== userProfile._id && (
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

            {userProfile.isAdmin == 'true' &&
                <button className="toggle-mode-btn static-edit-btn" onClick={toggleEditMode}>
                    {isEditMode ? <FaSave style={{ width: '20px', height: '20px' }} /> : <FaEdit style={{ width: '20px', height: '20px' }} />}
                </button>
            }
            

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
