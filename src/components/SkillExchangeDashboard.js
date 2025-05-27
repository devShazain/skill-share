import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import '../styles/SkillExchange.css';

const SkillExchangeDashboard = () => {
    const { currentUser } = useAuth();
    const [activeSessions, setActiveSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'skillSessions'),
            where('participants', 'array-contains', currentUser.uid),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setActiveSessions(sessions);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleMarkCompleted = async (sessionId) => {
        try {
            await updateDoc(doc(db, 'skillSessions', sessionId), {
                status: 'completed',
                completedAt: new Date()
            });
        } catch (error) {
            console.error('Error marking session as completed:', error);
        }
    };

    const getPartnerInfo = (session) => {
        const partnerId = session.participants.find(id => id !== currentUser.uid);
        const userRole = session.teacherUserId === currentUser.uid ? 'teacher' : 'learner';

        return {
            partnerId,
            partnerName: userRole === 'teacher' ? session.learnerName : session.teacherName,
            skillTeaching: userRole === 'teacher' ? session.skillOffered : session.skillRequested,
            skillLearning: userRole === 'teacher' ? session.skillRequested : session.skillOffered
        };
    };

    if (loading) {
        return (
            <div className="skill-exchange-container">
                <div className="loading-spinner">Loading your sessions...</div>
            </div>
        );
    }

    return (
        <div className="skill-exchange-container">
            <motion.div
                className="skill-exchange-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2>Your Active Skill Exchange Sessions</h2>
                <p>Manage your ongoing skill exchanges</p>
            </motion.div>

            {activeSessions.length === 0 ? (
                <motion.div
                    className="no-sessions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3>No Active Sessions</h3>
                    <p>You don't have any active skill exchange sessions yet.</p>
                </motion.div>
            ) : (
                <motion.div
                    className="sessions-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {activeSessions.map((session, index) => {
                        const partnerInfo = getPartnerInfo(session);
                        return (
                            <motion.div
                                key={session.id}
                                className="session-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="session-header">
                                    <h3>{partnerInfo.partnerName}</h3>
                                    <span className="session-status">{session.status}</span>
                                </div>

                                <div className="session-skills">
                                    <div className="skill-item teaching">
                                        <span className="skill-label">Teaching:</span>
                                        <span className="skill-name">{partnerInfo.skillTeaching}</span>
                                    </div>
                                    <div className="skill-item learning">
                                        <span className="skill-label">Learning:</span>
                                        <span className="skill-name">{partnerInfo.skillLearning}</span>
                                    </div>
                                </div>

                                <div className="session-date">
                                    Started: {session.createdAt?.toDate().toLocaleDateString()}
                                </div>

                                <motion.button
                                    className="complete-button"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleMarkCompleted(session.id)}
                                >
                                    Mark as Completed
                                </motion.button>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
};

export default SkillExchangeDashboard;