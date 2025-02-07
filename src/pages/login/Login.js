import React, { useEffect, useState } from 'react';

const Login = ({ setUserProfile }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [organization, setOrganization] = useState([]);
    const [usageRecord, setUsageRecord] = useState([]);

    useEffect(() => {
        const loadOrganization = async () => {
            try {
                const processedData = await window.electron.loadCsv('organization');
               
            
                setOrganization(processedData);
                console.log('Organization:', processedData);
            } catch (error) {
                console.error('Error loading organization data, creating organization', error);
            }
        };

        const loadUsageRecord = async () => {
            try {
                const processedData = await window.electron.loadCsv('usage-record');
                setUsageRecord(processedData);
                console.log('Usage Record:', processedData);
            } catch (error) {
                console.error('Error loading usage record data:', error);
            }
        };

        loadUsageRecord();
        loadOrganization();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const user = organization.find(
            (org) => org.username === email && org.password === password
        );

        if (user) {
            console.log('Login successful');
            setUserProfile(user);

            const newRecord = {
                _id: user._id,
                first_name: user.firstName,
                last_name: user.lastName,
                role: user.role,
                start_time: new Date().toISOString(),
            };

            window.electron.saveCsvFile('usage-record.csv', [...usageRecord, newRecord]);
        } else {
            alert('Invalid username or password');
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>Login</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Username:</label>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={styles.input}
                    />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={styles.input}
                    />
                </div>
                <button type="submit" style={styles.button}>Login</button>
            </form>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '400px',
        margin: '50px auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#24263B',
        fontFamily: 'Inter, sans-serif',
    },
    header: {
        textAlign: 'center',
        color: '#FFF',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        marginBottom: '5px',
        fontSize: '14px',
        color: '#FFF',

    },
    input: {
        padding: '10px',
        fontSize: '16px',
        borderRadius: '4px',
        border: '1px solid #ccc',
    },
    button: {
        padding: '10px',
        fontSize: '16px',
        color: '#000',
        backgroundColor: '#FFF',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
};

export default Login;
