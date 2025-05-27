import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SkillExchangeDashboard from './SkillExchangeDashboard';
import SkillRequestSystem from './SkillRequestSystem';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({
        activeSessions: 0,
        pendingRequests: 0,
        completedSessions: 0
    });

    useEffect(() => {
        // This would typically fetch real data from Firestore
        // For demo purposes, setting some placeholder stats
        setStats({
            activeSessions: 3,
            pendingRequests: 2,
            completedSessions: 5
        });
    }, []);

    const dashboardTabs = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'sessions', label: 'Sessions', icon: '🔄' },
        { id: 'requests', label: 'Requests', icon: '📨' }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'sessions':
                return <SkillExchangeDashboard />;
            case 'requests':
                return <SkillRequestSystem />;
            default:
                return (
                    <div className="overview-content">
                        <div className="welcome-section">
                            <motion.h2
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                Welcome back, <span className="gradient-text">{currentUser.displayName || 'User'}</span>
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                            >
                                Your hub for skill exchange and knowledge sharing
                            </motion.p>
                        </div>

                        <motion.div 
                            className="stats-grid"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            <StatCard 
                                title="Active Sessions"
                                value={stats.activeSessions}
                                icon="🔄"
                                color="var(--accent-primary)"
                                onClick={() => setActiveTab('sessions')}
                            />
                            <StatCard 
                                title="Pending Requests"
                                value={stats.pendingRequests}
                                icon="📨"
                                color="var(--accent-secondary)"
                                onClick={() => setActiveTab('requests')}
                            />
                            <StatCard 
                                title="Completed"
                                value={stats.completedSessions}
                                icon="✅"
                                color="var(--success)"
                            />
                        </motion.div>

                        <motion.div 
                            className="quick-actions"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <h3>Quick Actions</h3>
                            <div className="actions-grid">
                                <motion.div 
                                    className="action-card"
                                    whileHover={{ scale: 1.03, boxShadow: "0 10px 20px rgba(0,0,0,0.15)" }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate('/browse-users')}
                                >
                                    <div className="action-icon">🔍</div>
                                    <h4>Browse Users</h4>
                                    <p>Find people to exchange skills with</p>
                                </motion.div>
                                <motion.div 
                                    className="action-card"
                                    whileHover={{ scale: 1.03, boxShadow: "0 10px 20px rgba(0,0,0,0.15)" }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate('/profile')}
                                >
                                    <div className="action-icon">✏️</div>
                                    <h4>Update Profile</h4>
                                    <p>Add skills you can teach and want to learn</p>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                );
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-content">
                <div className="tabs-container">
                    <motion.div 
                        className="dashboard-tabs"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {dashboardTabs.map((tab) => (
                            <motion.button
                                key={tab.id}
                                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="tab-icon">{tab.icon}</span>
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div 
                                        className="tab-indicator" 
                                        layoutId="tabIndicator"
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </motion.button>
                        ))}
                    </motion.div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="tab-content"
                    >
                        {renderTabContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color, onClick }) => {
    return (
        <motion.div 
            className="stat-card"
            whileHover={{ scale: 1.03, boxShadow: "0 10px 20px rgba(0,0,0,0.15)" }}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className="stat-icon" style={{ backgroundColor: color }}>
                {icon}
            </div>
            <div className="stat-info">
                <h3 className="stat-value">{value}</h3>
                <p className="stat-title">{title}</p>
            </div>
        </motion.div>
    );
};

export default Dashboard;