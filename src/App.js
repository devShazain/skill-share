import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import SkillRequestSystem from './components/SkillRequestSystem';
import UserProfile from './components/UserProfile';
import BrowseUsers from './components/BrowseUsers';
import Navigation from './components/Navigation';
import AnimatedBackground from './components/AnimatedBackground';
import PrivateRoute from './components/PrivateRoute';
import ChatList from './components/ChatList';
import ChatPage from './components/ChatPage';
import './styles/theme.css';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <AnimatedBackground />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <>
                    <Navigation />
                    <main className="main-content">
                      <Dashboard />
                    </main>
                  </>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/requests" 
              element={
                <PrivateRoute>
                  <>
                    <Navigation />
                    <main className="main-content">
                      <SkillRequestSystem />
                    </main>
                  </>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <>
                    <Navigation />
                    <main className="main-content">
                      <UserProfile />
                    </main>
                  </>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/browse" 
              element={
                <PrivateRoute>
                  <>
                    <Navigation />
                    <main className="main-content">
                      <BrowseUsers />
                    </main>
                  </>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/chats" 
              element={
                <PrivateRoute>
                  <>
                    <Navigation />
                    <main className="main-content">
                      <ChatList />
                    </main>
                  </>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/chat/:sessionId" 
              element={
                <PrivateRoute>
                  <>
                    <Navigation />
                    <main className="main-content">
                      <ChatPage />
                    </main>
                  </>
                </PrivateRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
