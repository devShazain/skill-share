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
    const { currentUser, userProfile } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [partner, setPartner] = useState(null);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);

    // Fetch session details
    useEffect(() => {
        const fetchSession = async () => {
            try {
                console.log("Fetching session:", sessionId);
                const sessionDoc = await getDoc(doc(db, 'skillSessions', sessionId));
                
                if (sessionDoc.exists()) {
                    const sessionData = { id: sessionDoc.id, ...sessionDoc.data() };
                    console.log("Session data:", sessionData);
                    setSession(sessionData);
                    
                    // Determine partner ID
                    const partnerId = sessionData.participants?.find(id => id !== currentUser.uid);
                    console.log("Partner ID:", partnerId);
                    
                    if (partnerId) {
                        // Fetch partner details
                        const partnerDoc = await getDoc(doc(db, 'users', partnerId));
                        if (partnerDoc.exists()) {
                            const partnerData = partnerDoc.data();
                            console.log("Partner data:", partnerData);
                            setPartner(partnerData);
                        } else {
                            console.log("Partner document not found");
                            setError("Partner information not found");
                        }
                    } else {
                        console.log("No partner found in session");
                        setError("Invalid session data");
                    }
                } else {
                    console.log("Session not found");
                    setError("Session not found");
                }
            } catch (error) {
                console.error('Error fetching session:', error);
                setError("Failed to load chat session");
            } finally {
                setLoading(false);
            }
        };

        if (sessionId && currentUser) {
            fetchSession();
        }
    }, [sessionId, currentUser]);

    // Listen for messages
    useEffect(() => {
        if (!sessionId) return;

        console.log("Setting up message listener for session:", sessionId);
        
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
            console.log("Messages loaded:", messageData.length);
            setMessages(messageData);
        }, (error) => {
            console.error("Error listening to messages:", error);
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

        const messageText = newMessage.trim();
        setNewMessage(''); // Clear input immediately for better UX

        try {
            console.log("Sending message:", messageText);
            
            await addDoc(collection(db, 'messages'), {
                sessionId,
                senderId: currentUser.uid,
                senderName: userProfile?.displayName || currentUser.displayName || currentUser.email,
                text: messageText,
                timestamp: serverTimestamp(),
                createdAt: new Date()
            });

            console.log("Message sent successfully");
        } catch (error) {
            console.error('Error sending message:', error);
            setError("Failed to send message");
            setNewMessage(messageText); // Restore message on error
        }
    };

    const getSkillInfo = () => {
        if (!session) return { teaching: '', learning: '' };
        
        const userRole = session.teacherUserId === currentUser.uid ? 'teacher' : 'learner';
        
        return {
            teaching: userRole === 'teacher' ? session.skillOffered : session.skillRequested,
            learning: userRole === 'teacher' ? session.skillRequested : session.skillOffered
        };
    };

    if (loading) {
        return (
            <div className="chat-container">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading chat...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="chat-container">
                <div className="error-message">
                    <h3>⚠️ {error}</h3>
                    <p>Please try refreshing the page or go back to your conversations.</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="chat-container">
                <div className="error-message">
                    <h3>Session not found</h3>
                    <p>This chat session may have been removed or you don't have access to it.</p>
                </div>
            </div>
        );
    }

    const skillInfo = getSkillInfo();

    return (
        <div className="chat-container">
            <div className="chat-header">
                <div className="chat-partner-info">
                    <div className="partner-avatar">
                        {partner?.photoURL ? (
                            <img 
                                src={partner.photoURL} 
                                alt={partner.displayName || 'Partner'}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div 
                            className="avatar-placeholder"
                            style={{ display: partner?.photoURL ? 'none' : 'flex' }}
                        >
                            {partner?.displayName?.charAt(0) || '👤'}
                        </div>
                    </div>
                    <div className="partner-details">
                        <h3>{partner?.displayName || 'Partner'}</h3>
                        <div className="session-skills">
                            <span className="skill-badge teaching">
                                You're teaching: {skillInfo.teaching}
                            </span>
                            <span className="skill-badge learning">
                                You're learning: {skillInfo.learning}
                            </span>
                        </div>
                        <p className="session-date">
                            Session started: {session.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <div className="welcome-message">
                            <h4>👋 Welcome to your skill exchange chat!</h4>
                            <p>This is the beginning of your conversation with {partner?.displayName || 'your partner'}.</p>
                            <p>Start by introducing yourself and discussing how you'd like to exchange skills.</p>
                        </div>
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
                                {message.senderId !== currentUser.uid && (
                                    <div className="message-sender">{message.senderName}</div>
                                )}
                                <p>{message.text}</p>
                                <span className="message-time">
                                    {message.timestamp ? 
                                        new Date(message.timestamp.toDate()).toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        }) : 
                                        'Sending...'
                                    }
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
                    disabled={!!error}
                    maxLength={500}
                />
                <button 
                    type="submit" 
                    className="send-button" 
                    disabled={!newMessage.trim() || !!error}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;