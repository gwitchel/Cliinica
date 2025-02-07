import React, { useState, useEffect } from 'react';
import Card from '../../../components/card/card';
import './RecentChanges.css';

const RecentChanges = ({changelog}) => {
    const [changes, setChanges] = useState([]);

    useEffect(() => {
        // Simulate fetching data locally
        const localChanges = [
            'Change 1',
            'Change 2',
            'Change 3'
        ];
        setChanges(localChanges);
    }, []);

    return (
        <div style={{marginRight:'16px'}}>
            <h2>Recent Changes</h2>
            {changes.map((change, index) => (
                <Card key={index} title={change} />
            ))}
        </div>
    );
};

export default RecentChanges;