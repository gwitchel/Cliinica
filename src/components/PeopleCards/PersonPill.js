import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './PersonPill.css';
const { ipcRenderer } = window.require("electron");
import { FaUser, FaTrash } from 'react-icons/fa'; // FontAwesome icons

const PersonPill = ({ person}) => {
    return (
        <div style={{
            display:'flex',
            flexDirection: 'row', 
            justifyContent:'center', 
            alignItems:'center',
            borderRadius: '20px',
            backgroundColor: '#bbbbbb',
        }}>
            <FaUser/>
           <p>{person.firstName} {person.lastName}</p>
        </div>
    );
};


export default PersonPill;