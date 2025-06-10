import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const FirebaseTest = () => {
    const [testResults, setTestResults] = useState([]);
    const [testing, setTesting] = useState(false);

    const addResult = (test, success, error = null) => {
        setTestResults(prev => [...prev, { test, success, error }]);
    };

    const runTests = async () => {
        setTesting(true);
        setTestResults([]);

        try {
            // Test 1: Basic Firebase connection
            addResult("Firebase Initialization", true);

            // Test 2: Anonymous Auth
            try {
                await signInAnonymously(auth);
                addResult("Anonymous Authentication", true);
            } catch (error) {
                addResult("Anonymous Authentication", false, error.message);
            }

            // Test 3: Firestore Write
            try {
                const testDoc = doc(db, 'test', 'connection-test');
                await setDoc(testDoc, {
                    message: 'Firebase connection test',
                    timestamp: new Date()
                });
                addResult("Firestore Write", true);
            } catch (error) {
                addResult("Firestore Write", false, error.message);
            }

            // Test 4: Firestore Read
            try {
                const testDoc = doc(db, 'test', 'connection-test');
                const docSnap = await getDoc(testDoc);
                if (docSnap.exists()) {
                    addResult("Firestore Read", true);
                } else {
                    addResult("Firestore Read", false, "Document doesn't exist");
                }
            } catch (error) {
                addResult("Firestore Read", false, error.message);
            }

        } catch (error) {
            addResult("Firebase Initialization", false, error.message);
        }

        setTesting(false);
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h2>🔥 Firebase Connection Test</h2>
            
            <button 
                onClick={runTests} 
                disabled={testing}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: testing ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: testing ? 'not-allowed' : 'pointer'
                }}
            >
                {testing ? 'Running Tests...' : 'Run Firebase Tests'}
            </button>

            <div style={{ marginTop: '20px' }}>
                {testResults.map((result, index) => (
                    <div 
                        key={index}
                        style={{
                            padding: '10px',
                            margin: '5px 0',
                            backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                            border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
                            borderRadius: '5px'
                        }}
                    >
                        <strong>{result.success ? '✅' : '❌'} {result.test}</strong>
                        {result.error && (
                            <div style={{ color: '#721c24', marginTop: '5px', fontSize: '12px' }}>
                                Error: {result.error}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FirebaseTest; 