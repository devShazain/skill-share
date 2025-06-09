import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Navigation.css';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <nav className={`navigation ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <NavLink to="/dashboard" className="nav-logo">
          <span className="logo-text">Skill<span className="logo-accent">Share</span></span>
        </NavLink>

        <div className="nav-items desktop-nav">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Dashboard</span>
          </NavLink>
          
          <NavLink 
            to="/requests" 
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-text">Requests</span>
          </NavLink>
          
          <NavLink 
            to="/browse" 
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          >
            <span className="nav-icon">🔍</span>
            <span className="nav-text">Browse Users</span>
          </NavLink>
          
          <NavLink 
            to="/chats" 
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          >
            <span className="nav-icon">💬</span>
            <span className="nav-text">Chats</span>
          </NavLink>
          
          <NavLink 
            to="/profile" 
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-text">Profile</span>
          </NavLink>
          
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Logout</span>
          </button>
        </div>

        <button 
          className="mobile-menu-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <div className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            >
              <span className="nav-icon">🏠</span>
              <span className="nav-text">Dashboard</span>
            </NavLink>
            
            <NavLink 
              to="/requests" 
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            >
              <span className="nav-icon">📋</span>
              <span className="nav-text">Requests</span>
            </NavLink>
            
            <NavLink 
              to="/browse" 
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            >
              <span className="nav-icon">🔍</span>
              <span className="nav-text">Browse Users</span>
            </NavLink>
            
            <NavLink 
              to="/chats" 
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            >
              <span className="nav-icon">💬</span>
              <span className="nav-text">Chats</span>
            </NavLink>
            
            <NavLink 
              to="/profile" 
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            >
              <span className="nav-icon">👤</span>
              <span className="nav-text">Profile</span>
            </NavLink>
            
            <button className="nav-item logout-btn" onClick={handleLogout}>
              <span className="nav-icon">🚪</span>
              <span className="nav-text">Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;