import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import '../styles/BrowseUsers.css';

const BrowseUsers = () => {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [skillToLearn, setSkillToLearn] = useState('');
    const [skillToTeach, setSkillToTeach] = useState('');

    const fetchUsers = useCallback(async () => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('uid', '!=', currentUser.uid));
            const querySnapshot = await getDocs(q);

            const usersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setUsers(usersData);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, [currentUser.uid]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleRequestExchange = (user) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();

        try {
            await addDoc(collection(db, 'skillRequests'), {
                from_user: currentUser.uid,
                from_user_name: currentUser.displayName || currentUser.email,
                to_user: selectedUser.id,
                to_user_name: selectedUser.displayName || selectedUser.email,
                skill_requested: skillToLearn,
                skill_offered: skillToTeach,
                status: 'pending',
                createdAt: new Date()
            });

            setShowModal(false);
            setSelectedUser(null);
            setSkillToLearn('');
            setSkillToTeach('');
        } catch (error) {
            console.error('Error sending request:', error);
        }
    };

    if (loading) {
        return (
            <div className="browse-users-container">
                <div className="loading">Loading users...</div>
            </div>
        );
    }

    return (
        <div className="browse-users-container">
            <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="browse-title"
            >
                Browse Skill Sharers
            </motion.h2>

            <div className="users-grid">
                {users.map((user) => (
                    <motion.div
                        key={user.id}
                        className="user-card"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="user-image">
                            <img src={user.photoURL || '/default-avatar.png'} alt={user.displayName} />
                        </div>
                        <div className="user-info">
                            <h3>{user.displayName || 'Anonymous User'}</h3>
                            <div className="skills-section">
                                <h4>Can Teach:</h4>
                                <div className="skills-list">
                                    {user.teachSkills?.map((skill, index) => (
                                        <span key={index} className="skill-tag">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button
                            className="request-button"
                            onClick={() => handleRequestExchange(user)}
                        >
                            Request Skill Exchange
                        </button>
                    </motion.div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <motion.div
                        className="modal"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h3>Request Skill Exchange</h3>
                        <form onSubmit={handleSubmitRequest}>
                            <div className="form-group">
                                <label>Skill you want to learn:</label>
                                <select
                                    value={skillToLearn}
                                    onChange={(e) => setSkillToLearn(e.target.value)}
                                    required
                                >
                                    <option value="">Select a skill</option>
                                    {selectedUser?.teachSkills?.map((skill, index) => (
                                        <option key={index} value={skill}>{skill}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Skill you can teach:</label>
                                <select
                                    value={skillToTeach}
                                    onChange={(e) => setSkillToTeach(e.target.value)}
                                    required
                                >
                                    <option value="">Select a skill</option>
                                    {currentUser?.teachSkills?.map((skill, index) => (
                                        <option key={index} value={skill}>{skill}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit">Send Request</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default BrowseUsers;