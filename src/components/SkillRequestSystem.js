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
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingRequests, setOutgoingRequests] = useState([]);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [skillRequested, setSkillRequested] = useState('');
    const [skillOffered, setSkillOffered] = useState('');
    const [loading, setLoading] = useState(false);
    const [formSubmitted, setFormSubmitted] = useState(false);

    useEffect(() => {
        // Fetch users (in a real app, you'd have a users collection)
        fetchUsers();

        // Listen for incoming requests
        const incomingQuery = query(
            collection(db, 'skillRequests'),
            where('to_user', '==', currentUser.uid),
            where('status', '==', 'pending'),
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
            setIncomingRequests(requests);
        });

        const unsubscribeOutgoing = onSnapshot(outgoingQuery, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setOutgoingRequests(requests);
        });

        return () => {
            unsubscribeIncoming();
            unsubscribeOutgoing();
        };
    }, [currentUser]);

    const fetchUsers = async () => {
        try {
            const usersCollection = collection(db, 'users');
            const userQuery = query(usersCollection, where('uid', '!=', currentUser.uid));
            const querySnapshot = await getDocs(userQuery);
            
            const usersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const handleSendRequest = async (e) => {
        e.preventDefault();
        if (!selectedUser || !skillRequested || !skillOffered) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'skillRequests'), {
                from_user: currentUser.uid,
                from_user_name: currentUser.displayName || currentUser.email,
                to_user: selectedUser.id,
                to_user_name: selectedUser.displayName || selectedUser.email,
                skill_requested: skillRequested,
                skill_offered: skillOffered,
                status: 'pending',
                createdAt: new Date()
            });

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
        } finally {
            setLoading(false);
        }
    };

    const handleRequestResponse = async (requestId, response) => {
        try {
            await updateDoc(doc(db, 'skillRequests', requestId), {
                status: response,
                respondedAt: new Date()
            });

            // If accepted, create a skill session
            if (response === 'accepted') {
                const request = incomingRequests.find(req => req.id === requestId);
                await addDoc(collection(db, 'skillSessions'), {
                    participants: [request.from_user, request.to_user],
                    teacherUserId: request.to_user, // The person who accepted is teaching
                    learnerUserId: request.from_user,
                    teacherName: request.to_user_name,
                    learnerName: request.from_user_name,
                    skillOffered: request.skill_requested, // What the accepter will teach
                    skillRequested: request.skill_offered, // What the accepter will learn
                    status: 'active',
                    createdAt: new Date()
                });
            }
        } catch (error) {
            console.error('Error responding to request:', error);
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
                >
                    {showRequestForm ? 'Cancel' : 'New Request'}
                </motion.button>
            </motion.div>

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
                                            value={selectedUser?.id || ''}
                                            onChange={(e) => setSelectedUser(users.find(u => u.id === e.target.value))}
                                            required
                                        >
                                            <option value="">Choose a user...</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.displayName || user.email || 'User'}
                                                </option>
                                            ))}
                                        </select>
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
                                            )) || []}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Skill you can teach:</label>
                                        <select
                                            value={skillOffered}
                                            onChange={(e) => setSkillOffered(e.target.value)}
                                            required
                                        >
                                            <option value="">Select a skill...</option>
                                            {currentUser?.teachSkills?.map((skill, index) => (
                                                <option key={index} value={skill}>{skill}</option>
                                            )) || []}
                                        </select>
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={loading || !selectedUser || !skillRequested || !skillOffered} 
                                        className="send-request-button"
                                    >
                                        {loading ? (
                                            <div className="button-loader">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        ) : 'Send Request'}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="requests-container">
                <motion.div 
                    className="requests-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="section-header">
                        <h3>Incoming Requests</h3>
                    </div>
                    {incomingRequests.length === 0 ? (
                        <motion.div 
                            className="empty-state"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="empty-icon">📭</div>
                            <p>No incoming requests</p>
                        </motion.div>
                    ) : (
                        <div className="requests-grid">
                            {incomingRequests.map((request, index) => (
                                <motion.div
                                    key={request.id}
                                    className="request-card incoming"
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div className="request-card-header">
                                        <h4>{request.from_user_name}</h4>
                                        <span className="request-date">
                                            {request.createdAt?.toDate().toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="request-details">
                                        <div className="skill-exchange">
                                            <div className="skill-item">
                                                <span className="skill-label">Wants to learn:</span>
                                                <span className="skill-value">{request.skill_requested}</span>
                                            </div>
                                            <div className="exchange-icon">🔄</div>
                                            <div className="skill-item">
                                                <span className="skill-label">Can teach:</span>
                                                <span className="skill-value">{request.skill_offered}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="request-actions">
                                        <motion.button
                                            className="accept-button"
                                            onClick={() => handleRequestResponse(request.id, 'accepted')}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Accept
                                        </motion.button>
                                        <motion.button
                                            className="reject-button"
                                            onClick={() => handleRequestResponse(request.id, 'rejected')}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Reject
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

                <motion.div 
                    className="requests-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="section-header">
                        <h3>Your Requests</h3>
                    </div>
                    {outgoingRequests.length === 0 ? (
                        <motion.div 
                            className="empty-state"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="empty-icon">📤</div>
                            <p>No outgoing requests</p>
                        </motion.div>
                    ) : (
                        <div className="requests-grid">
                            {outgoingRequests.map((request, index) => (
                                <motion.div
                                    key={request.id}
                                    className={`request-card outgoing ${request.status}`}
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div className="request-card-header">
                                        <h4>To: {request.to_user_name}</h4>
                                        <div className="status-container">
                                            <span className={`status-badge ${request.status}`}>
                                                {getStatusEmoji(request.status)} {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="request-details">
                                        <div className="skill-exchange">
                                            <div className="skill-item">
                                                <span className="skill-label">You want to learn:</span>
                                                <span className="skill-value">{request.skill_requested}</span>
                                            </div>
                                            <div className="exchange-icon">🔄</div>
                                            <div className="skill-item">
                                                <span className="skill-label">You can teach:</span>
                                                <span className="skill-value">{request.skill_offered}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="request-footer">
                                        <span className="request-date">
                                            Sent: {request.createdAt?.toDate().toLocaleDateString()}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default SkillRequestSystem;