import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    collection,
    query,
    where,
    onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import '../styles/BrowseUsers.css';

const BrowseUsers = () => {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Real-time user fetching
    useEffect(() => {
        if (!currentUser) return;

        console.log("Setting up real-time user listener...");
        
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '!=', currentUser.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log("Real-time users update:", usersData.length);
            setUsers(usersData);
            setLoading(false);
        }, (error) => {
            console.error('Error listening to users:', error);
            setError('Failed to load users. Please try again.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    if (loading) {
        return (
            <div className="browse-users-container">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading users...</p>
                </div>
            </div>
        );
    }

    if (error && users.length === 0) {
        return (
            <div className="browse-users-container">
                <div className="error-message">
                    <h3>⚠️ {error}</h3>
                    <button onClick={() => {
                        window.location.reload();
                    }} className="retry-button">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const getUserStats = (user) => {
        const teachCount = user.teachSkills?.length || 0;
        const learnCount = user.learnSkills?.length || 0;
        return { teachCount, learnCount };
    };

    return (
        <div className="browse-users-container">
            <motion.div
                className="browse-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="header-content">
                    <h2 className="browse-title">Browse Skill Sharers</h2>
                    <p className="browse-subtitle">
                        Discover talented individuals and their expertise. Use the Requests section to connect.
                    </p>
                </div>
                <div className="stats-summary">
                    <div className="stat-item">
                        <span className="stat-number">{users.length}</span>
                        <span className="stat-label">Members</span>
                    </div>
                </div>
            </motion.div>

            {users.length === 0 && !loading && (
                <motion.div
                    className="no-users-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="empty-illustration">🌟</div>
                    <h3>No other members yet</h3>
                    <p>Be the first to share your skills and start building the community!</p>
                </motion.div>
            )}

            <div className="users-grid">
                {users.map((user, index) => {
                    const { teachCount, learnCount } = getUserStats(user);
                    
                    return (
                        <motion.div
                            key={user.id}
                            className="user-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
                        >
                            {/* User Header */}
                            <div className="user-header">
                                <div className="user-avatar">
                                    <img 
                                        src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=6366f1&color=white&size=80`} 
                                        alt={user.displayName || 'User'}
                                        onError={(e) => {
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=6366f1&color=white&size=80`;
                                        }}
                                    />
                                    <div className="online-indicator"></div>
                                </div>
                                <div className="user-basic-info">
                                    <h3 className="user-name">{user.displayName || 'Anonymous User'}</h3>
                                    {user.profession && (
                                        <p className="user-profession">{user.profession}</p>
                                    )}
                                    {user.location && (
                                        <p className="user-location">
                                            <span className="location-icon">📍</span>
                                            {user.location}
                                        </p>
                                    )}
                                </div>
                                <div className="user-stats">
                                    <div className="stat-badge teach">
                                        <span className="stat-number">{teachCount}</span>
                                        <span className="stat-text">Teaches</span>
                                    </div>
                                    <div className="stat-badge learn">
                                        <span className="stat-number">{learnCount}</span>
                                        <span className="stat-text">Learning</span>
                                    </div>
                                </div>
                            </div>

                            {/* User Bio */}
                            {user.bio && (
                                <div className="user-bio">
                                    <p>{user.bio}</p>
                                </div>
                            )}

                            {/* Skills Section */}
                            <div className="user-skills">
                                {/* Teaching Skills */}
                                {user.teachSkills && user.teachSkills.length > 0 && (
                                    <div className="skills-section">
                                        <div className="skills-header">
                                            <h4>Can Teach</h4>
                                            <span className="skills-count">{teachCount}</span>
                                        </div>
                                        <div className="skills-list">
                                            {user.teachSkills.slice(0, 6).map((skill, index) => (
                                                <span key={index} className="skill-tag teach-skill">
                                                    {skill}
                                                </span>
                                            ))}
                                            {teachCount > 6 && (
                                                <span className="skill-tag more-skills">
                                                    +{teachCount - 6} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Learning Skills */}
                                {user.learnSkills && user.learnSkills.length > 0 && (
                                    <div className="skills-section">
                                        <div className="skills-header">
                                            <h4>Wants to Learn</h4>
                                            <span className="skills-count">{learnCount}</span>
                                        </div>
                                        <div className="skills-list">
                                            {user.learnSkills.slice(0, 6).map((skill, index) => (
                                                <span key={index} className="skill-tag learn-skill">
                                                    {skill}
                                                </span>
                                            ))}
                                            {learnCount > 6 && (
                                                <span className="skill-tag more-skills">
                                                    +{learnCount - 6} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* No Skills State */}
                                {(!user.teachSkills || user.teachSkills.length === 0) && 
                                 (!user.learnSkills || user.learnSkills.length === 0) && (
                                    <div className="no-skills-state">
                                        <span className="no-skills-icon">💭</span>
                                        <p>This user hasn't added any skills yet</p>
                                    </div>
                                )}
                            </div>

                            {/* User Footer */}
                            <div className="user-footer">
                                <div className="join-date">
                                    Member since {user.createdAt ? 
                                        new Date(user.createdAt.toDate()).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            year: 'numeric' 
                                        }) : 
                                        'Recently'
                                    }
                                </div>
                                <div className="interaction-hint">
                                    💡 Visit Requests section to connect
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default BrowseUsers;