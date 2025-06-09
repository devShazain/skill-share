import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Chat.css';

const Chat = ({ sessionId }) => {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [partner, setPartner] = useState(null);
    const messagesEndRef = useRef(null);

    // Fetch session details
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const sessionDoc = await getDoc(doc(db, 'skillSessions', sessionId));
                if (sessionDoc.exists()) {
                    const sessionData = sessionDoc.data();
                    setSession(sessionData);
                    
                    // Determine partner ID
                    const partnerId = sessionData.participants.find(id => id !== currentUser.uid);
                    
                    // Fetch partner details
                    const partnerDoc = await getDoc(doc(db, 'users', partnerId));
                    if (partnerDoc.exists()) {
                        setPartner(partnerDoc.data());
                    }
                }
            } catch (error) {
                console.error('Error fetching session:', error);
            } finally {
                setLoading(false);
            }
        };

        if (sessionId) {
            fetchSession();
        }
    }, [sessionId, currentUser]);

    // Listen for messages
    useEffect(() => {
        if (!sessionId) return;

        const q = query(
            collection(db, 'messages'),
            where('sessionId', '==', sessionId),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messageData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(messageData);
        });

        return () => unsubscribe();
    }, [sessionId]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await addDoc(collection(db, 'messages'), {
                sessionId,
                senderId: currentUser.uid,
                senderName: currentUser.displayName || currentUser.email,
                text: newMessage,
                timestamp: serverTimestamp()
            });

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    if (loading) {
        return (
            <div className="chat-container">
                <div className="loading">Loading chat...</div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="chat-container">
                <div className="error-message">Session not found</div>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <div className="chat-header">
                <div className="chat-partner-info">
                    <div className="partner-avatar">
                        {partner?.photoURL ? (
                            <img src={partner.photoURL} alt={partner.displayName} />
                        ) : (
                            <div className="avatar-placeholder">
                                {partner?.displayName?.charAt(0) || '?'}
                            </div>
                        )}
                    </div>
                    <div className="partner-details">
                        <h3>{partner?.displayName || 'Partner'}</h3>
                        <div className="session-skills">
                            <span className="skill-badge teaching">
                                Teaching: {session.skillFromUser1 === currentUser.uid ? session.skillFromUser1 : session.skillFromUser2}
                            </span>
                            <span className="skill-badge learning">
                                Learning: {session.skillFromUser1 === currentUser.uid ? session.skillFromUser2 : session.skillFromUser1}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <motion.div
                            key={message.id}
                            className={`message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="message-content">
                                <p>{message.text}</p>
                                <span className="message-time">
                                    {message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                </span>
                            </div>
                        </motion.div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="message-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                />
                <button type="submit" className="send-button" disabled={!newMessage.trim()}>
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;