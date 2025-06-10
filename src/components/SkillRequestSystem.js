import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    orderBy,
    getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import '../styles/SkillRequest.css';

const SkillRequestSystem = () => {
    const { currentUser, userProfile } = useAuth();
    const [users, setUsers] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingRequests, setOutgoingRequests] = useState([]);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [skillRequested, setSkillRequested] = useState('');
    const [skillOffered, setSkillOffered] = useState('');
    const [loading, setLoading] = useState(false);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!currentUser) return;

        // Fetch users
        fetchUsers();

        // Listen for incoming requests
        const incomingQuery = query(
            collection(db, 'skillRequests'),
            where('to_user', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const outgoingQuery = query(
            collection(db, 'skillRequests'),
            where('from_user', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribeIncoming = onSnapshot(incomingQuery, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log("Incoming requests:", requests);
            setIncomingRequests(requests);
        }, (error) => {
            console.error("Error listening to incoming requests:", error);
        });

        const unsubscribeOutgoing = onSnapshot(outgoingQuery, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log("Outgoing requests:", requests);
            setOutgoingRequests(requests);
        }, (error) => {
            console.error("Error listening to outgoing requests:", error);
        });

        return () => {
            unsubscribeIncoming();
            unsubscribeOutgoing();
        };
    }, [currentUser]);

    const fetchUsers = async () => {
        try {
            console.log("Fetching users for skill requests...");
            const usersCollection = collection(db, 'users');
            const userQuery = query(usersCollection, where('uid', '!=', currentUser.uid));
            const querySnapshot = await getDocs(userQuery);
            
            const usersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log("Found users for requests:", usersData.length);
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
            setError('Failed to load users.');
        }
    };

    const handleSendRequest = async (e) => {
        e.preventDefault();
        if (!selectedUser || !skillRequested || !skillOffered) return;

        setLoading(true);
        setError('');
        
        try {
            console.log("Sending skill request...");
            
            await addDoc(collection(db, 'skillRequests'), {
                from_user: currentUser.uid,
                from_user_name: userProfile?.displayName || currentUser.displayName || currentUser.email,
                to_user: selectedUser.uid || selectedUser.id,
                to_user_name: selectedUser.displayName || selectedUser.email,
                skill_requested: skillRequested,
                skill_offered: skillOffered,
                status: 'pending',
                createdAt: new Date(),
                lastUpdated: new Date()
            });

            console.log("Request sent successfully");
            
            // Reset form
            setFormSubmitted(true);
            setTimeout(() => {
                setShowRequestForm(false);
                setSelectedUser(null);
                setSkillRequested('');
                setSkillOffered('');
                setFormSubmitted(false);
            }, 2000);
        } catch (error) {
            console.error('Error sending request:', error);
            setError('Failed to send request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestResponse = async (requestId, response) => {
        try {
            console.log(`${response} request:`, requestId);
            
            await updateDoc(doc(db, 'skillRequests', requestId), {
                status: response,
                respondedAt: new Date(),
                lastUpdated: new Date()
            });

            // If accepted, create a skill session
            if (response === 'accepted') {
                const request = incomingRequests.find(req => req.id === requestId);
                if (request) {
                    await addDoc(collection(db, 'skillSessions'), {
                        participants: [request.from_user, request.to_user],
                        teacherUserId: request.to_user, // The person who accepted is teaching
                        learnerUserId: request.from_user,
                        teacherName: request.to_user_name,
                        learnerName: request.from_user_name,
                        skillOffered: request.skill_requested, // What the accepter will teach
                        skillRequested: request.skill_offered, // What the accepter will learn
                        status: 'active',
                        createdAt: new Date(),
                        lastUpdated: new Date()
                    });
                    console.log("Skill session created successfully");
                }
            }
        } catch (error) {
            console.error('Error responding to request:', error);
            setError('Failed to respond to request. Please try again.');
        }
    };

    const getStatusEmoji = (status) => {
        switch(status) {
            case 'pending': return '⏳';
            case 'accepted': return '✅';
            case 'rejected': return '❌';
            default: return '⏳';
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'pending': return '#fbbf24';
            case 'accepted': return '#10b981';
            case 'rejected': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="skill-request-container">
            <motion.div
                className="request-header-container"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="request-header-content">
                    <motion.h2
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="request-title"
                    >
                        Skill Request System
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="request-subtitle"
                    >
                        Exchange knowledge and grow your skills
                    </motion.p>
                </div>
                <motion.button
                    className="new-request-button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowRequestForm(!showRequestForm)}
                    disabled={!userProfile?.teachSkills || userProfile.teachSkills.length === 0}
                >
                    {showRequestForm ? 'Cancel' : 'New Request'}
                </motion.button>
            </motion.div>

            {error && (
                <motion.div
                    className="error-banner"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    ⚠️ {error}
                </motion.div>
            )}

            {!userProfile?.teachSkills || userProfile.teachSkills.length === 0 ? (
                <motion.div
                    className="info-banner"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    📝 Please add skills you can teach to your profile before making requests.
                </motion.div>
            ) : null}

            <AnimatePresence mode="wait">
                {showRequestForm && (
                    <motion.div
                        className="request-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <motion.div 
                            className="form-card"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h3>Send a Skill Request</h3>
                            
                            {formSubmitted ? (
                                <motion.div 
                                    className="success-message"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <span className="success-icon">✅</span>
                                    <p>Request sent successfully!</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSendRequest}>
                                    <div className="form-group">
                                        <label>Select User:</label>
                                        <select
                                            value={selectedUser?.id || selectedUser?.uid || ''}
                                            onChange={(e) => setSelectedUser(users.find(u => (u.id === e.target.value || u.uid === e.target.value)))}
                                            required
                                        >
                                            <option value="">Choose a user...</option>
                                            {users.filter(user => user.teachSkills && user.teachSkills.length > 0).map(user => (
                                                <option key={user.id || user.uid} value={user.id || user.uid}>
                                                    {user.displayName || user.email || 'User'} ({user.teachSkills?.length || 0} skills)
                                                </option>
                                            ))}
                                        </select>
                                        {users.filter(user => user.teachSkills && user.teachSkills.length > 0).length === 0 && (
                                            <p className="form-hint">No users with teachable skills found yet.</p>
                                        )}
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Skill you want to learn:</label>
                                        <select
                                            value={skillRequested}
                                            onChange={(e) => setSkillRequested(e.target.value)}
                                            required
                                            disabled={!selectedUser}
                                        >
                                            <option value="">Select a skill...</option>
                                            {selectedUser?.teachSkills?.map((skill, index) => (
                                                <option key={index} value={skill}>{skill}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Skill you can teach in return:</label>
                                        <select
                                            value={skillOffered}
                                            onChange={(e) => setSkillOffered(e.target.value)}
                                            required
                                        >
                                            <option value="">Select a skill...</option>
                                            {userProfile?.teachSkills?.map((skill, index) => (
                                                <option key={index} value={skill}>{skill}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="form-actions">
                                        <button
                                            type="button"
                                            onClick={() => setShowRequestForm(false)}
                                            className="cancel-button"
                                            disabled={loading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="send-button"
                                            disabled={loading || !selectedUser || !skillRequested || !skillOffered}
                                        >
                                            {loading ? 'Sending...' : 'Send Request'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="requests-section">
                <div className="requests-grid">
                    {/* Incoming Requests */}
                    <motion.div 
                        className="requests-column"
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.2 }}
                    >
                        <h3>Incoming Requests</h3>
                        <div className="requests-list">
                            {incomingRequests.length > 0 ? (
                                incomingRequests.map((request) => (
                                    <motion.div
                                        key={request.id}
                                        className="request-card"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="request-header">
                                            <h4>{request.from_user_name}</h4>
                                            <span 
                                                className="status-badge"
                                                style={{ backgroundColor: getStatusColor(request.status) }}
                                            >
                                                {getStatusEmoji(request.status)} {request.status}
                                            </span>
                                        </div>
                                        <div className="request-content">
                                            <p><strong>Wants to learn:</strong> {request.skill_requested}</p>
                                            <p><strong>Can teach:</strong> {request.skill_offered}</p>
                                            <p className="request-date">
                                                {request.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                                            </p>
                                        </div>
                                        {request.status === 'pending' && (
                                            <div className="request-actions">
                                                <button
                                                    onClick={() => handleRequestResponse(request.id, 'accepted')}
                                                    className="accept-button"
                                                >
                                                    ✅ Accept
                                                </button>
                                                <button
                                                    onClick={() => handleRequestResponse(request.id, 'rejected')}
                                                    className="reject-button"
                                                >
                                                    ❌ Reject
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                ))
                            ) : (
                                <div className="no-requests">
                                    <p>No incoming requests yet.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Outgoing Requests */}
                    <motion.div 
                        className="requests-column"
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.3 }}
                    >
                        <h3>Outgoing Requests</h3>
                        <div className="requests-list">
                            {outgoingRequests.length > 0 ? (
                                outgoingRequests.map((request) => (
                                    <motion.div
                                        key={request.id}
                                        className="request-card"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="request-header">
                                            <h4>{request.to_user_name}</h4>
                                            <span 
                                                className="status-badge"
                                                style={{ backgroundColor: getStatusColor(request.status) }}
                                            >
                                                {getStatusEmoji(request.status)} {request.status}
                                            </span>
                                        </div>
                                        <div className="request-content">
                                            <p><strong>You want to learn:</strong> {request.skill_requested}</p>
                                            <p><strong>You offered to teach:</strong> {request.skill_offered}</p>
                                            <p className="request-date">
                                                {request.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="no-requests">
                                    <p>No outgoing requests yet.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default SkillRequestSystem;