import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    doc,
    getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ChatList.css';

const ChatList = () => {
    const { currentUser } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [partnerDetails, setPartnerDetails] = useState({});

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'skillSessions'),
            where('participants', 'array-contains', currentUser.uid),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const sessionsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSessions(sessionsData);

            // Fetch partner details for each session
            const partnerIds = sessionsData.map(session => 
                session.participants.find(id => id !== currentUser.uid)
            );

            const uniquePartnerIds = [...new Set(partnerIds)];
            const partnerData = {};

            for (const partnerId of uniquePartnerIds) {
                try {
                    const partnerDoc = await getDoc(doc(db, 'users', partnerId));
                    if (partnerDoc.exists()) {
                        partnerData[partnerId] = partnerDoc.data();
                    }
                } catch (error) {
                    console.error(`Error fetching partner ${partnerId}:`, error);
                }
            }

            setPartnerDetails(partnerData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const getPartnerInfo = (session) => {
        const partnerId = session.participants.find(id => id !== currentUser.uid);
        const partner = partnerDetails[partnerId] || {};
        const userRole = session.teacherUserId === currentUser.uid ? 'teacher' : 'learner';

        return {
            partnerId,
            partnerName: partner.displayName || 'User',
            partnerPhoto: partner.photoURL || '',
            skillTeaching: userRole === 'teacher' ? session.skillOffered : session.skillRequested,
            skillLearning: userRole === 'teacher' ? session.skillRequested : session.skillOffered
        };
    };

    if (loading) {
        return (
            <div className="chat-list-container">
                <div className="loading">Loading your conversations...</div>
            </div>
        );
    }

    return (
        <div className="chat-list-container">
            <motion.h2
                className="chat-list-title"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Your Conversations
            </motion.h2>

            {sessions.length === 0 ? (
                <motion.div
                    className="no-sessions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3>No Active Conversations</h3>
                    <p>You don't have any active skill exchange sessions yet.</p>
                    <Link to="/browse" className="browse-link">Browse users to start exchanging skills</Link>
                </motion.div>
            ) : (
                <motion.div
                    className="chat-sessions-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {sessions.map((session) => {
                        const { partnerId, partnerName, partnerPhoto, skillTeaching, skillLearning } = getPartnerInfo(session);
                        
                        return (
                            <motion.div
                                key={session.id}
                                className="chat-session-card"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link to={`/chat/${session.id}`} className="session-link">
                                    <div className="partner-avatar">
                                        {partnerPhoto ? (
                                            <img src={partnerPhoto} alt={partnerName} />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {partnerName.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="session-details">
                                        <h3 className="partner-name">{partnerName}</h3>
                                        <div className="session-skills">
                                            <span className="skill-badge teaching">Teaching: {skillTeaching}</span>
                                            <span className="skill-badge learning">Learning: {skillLearning}</span>
                                        </div>
                                    </div>
                                    <div className="session-time">
                                        {session.createdAt ? new Date(session.createdAt.toDate()).toLocaleDateString() : 'Recent'}
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
};

export default ChatList;