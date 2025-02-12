import React, { useState, useEffect } from "react";
import "./Organization.css";
import { FaEdit, FaTrash } from "react-icons/fa";

const Organization = ({ userProfile, setUpdatedOrganization }) => {
  const [organizations, setOrganizations] = useState([]);
  const [currentMember, setCurrentMember] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const processedData = await window.electron.loadCsv("organization");
      setOrganizations(processedData);
    } catch (error) {
      console.error("Error loading organizations data:", error);
    }
  };

  const openAddMemberModal = () => {
    if (userProfile.isAdmin == 'false') return;
    setIsEditing(false);
    setCurrentMember({
      firstName: "",
      lastName: "",
      username: "",
      password: "",
      role: "",
      isAdmin: false,
    });
    setShowModal(true);
  };

  const openEditMemberModal = (member) => {
    if (userProfile.isAdmin == 'false') return;
    setIsEditing(true);
    setCurrentMember({ ...member });
    setShowModal(true);
  };

  const handleSaveMember = () => {
    if (!currentMember.firstName || !currentMember.lastName) {
      alert("First Name and Last Name are required.");
      return;
    }

    let updatedList;
    if (isEditing) {
      // Update existing member
      updatedList = organizations.map((org) =>
        org._id === currentMember._id ? currentMember : org
      );
    } else {
      // Add new member
      const newMemberId = Date.now();
      updatedList = [...organizations, { _id: newMemberId, ...currentMember }];
    }

    setOrganizations(updatedList);
    setUpdatedOrganization(updatedList);
    window.electron.saveCsvFile("organization.csv", updatedList);
    setShowModal(false);
  };

  const handleDeleteMember = () => {
    if (memberToDelete !== null) {
        const member = organizations[memberToDelete];

        // Prevent user from deleting themselves
        if (member._id === userProfile._id) {
            alert("You cannot delete yourself.");
            setShowDeleteConfirmation(false);
            return;
        }

        const updatedList = organizations.filter((_, index) => index !== memberToDelete);
        setOrganizations(updatedList);
        window.electron.saveCsvFile("organization.csv", updatedList);
        setShowDeleteConfirmation(false);
        setMemberToDelete(null);
    }
};


  return (
    <div className="organization-container">
      <div className="org-cards">
        {organizations.length ? (
          organizations.map((organization, index) => (
            <div key={index} className="org-card">
              <h2>
                {organization.firstName} {organization.lastName}
              </h2>
              <p>Role: {organization.role}</p>
              <p>Username: {organization.username || "N/A"}</p>
              <p>Admin: {organization.isAdmin == 'true' ? "Yes" : "No"}</p>
              {userProfile.isAdmin == 'true' && (
                <div className="org-actions">
                    <button className="edit-btn" onClick={() => openEditMemberModal(organization)}>
                        <FaEdit /> Edit
                    </button>
                    <button
                        className="delete-btn"
                        onClick={() => {
                            if (organization._id === userProfile._id) {
                                alert("You cannot delete yourself.");
                            } else {
                                setShowDeleteConfirmation(true);
                                setMemberToDelete(index);
                            }
                        }}
                        disabled={organization._id === userProfile._id} // Disable button for self
                    >
                        <FaTrash /> Delete
                    </button>
                </div>
            )}
            </div>
          ))
        ) : (
          <div style={{ marginTop: "20px" }}>
            <strong>Add an admin user to begin</strong>
          </div>
        )}
      </div>

      {userProfile.isAdmin != 'false' && (
        <button className="add-member-btn" onClick={openAddMemberModal}>
          Add New Member
        </button>
      )}

      {/* Add/Edit Member Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{isEditing ? "Edit Member" : "Add New Member"}</h2>
            <input
              type="text"
              placeholder="First Name"
              value={currentMember.firstName}
              onChange={(e) => setCurrentMember({ ...currentMember, firstName: e.target.value })}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={currentMember.lastName}
              onChange={(e) => setCurrentMember({ ...currentMember, lastName: e.target.value })}
            />
            <input
              type="text"
              placeholder="Username"
              value={currentMember.username}
              onChange={(e) => setCurrentMember({ ...currentMember, username: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              value={currentMember.password}
              onChange={(e) => setCurrentMember({ ...currentMember, password: e.target.value })}
            />
            <input
              type="text"
              placeholder="Role"
              value={currentMember.role}
              onChange={(e) => setCurrentMember({ ...currentMember, role: e.target.value })}
            />
            <div className="switch-container">
                <span>Admin Privileges</span>
                <label className="switch">
                    <input
                        type="checkbox"
                        checked={currentMember.isAdmin}
                        onChange={(e) => setCurrentMember({ ...currentMember, isAdmin: e.target.checked })}
                    />
                    <span className="slider"></span>
                </label>
            </div>

            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="modal-add" onClick={handleSaveMember}>
                {isEditing ? "Save Changes" : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Are you sure?</h2>
            <p>Deleting this member is irreversible.</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowDeleteConfirmation(false)}>
                Cancel
              </button>
              <button className="modal-delete" onClick={handleDeleteMember}>
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
