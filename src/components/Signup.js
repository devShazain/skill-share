import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const Signup = () => {
    const nameRef = useRef();
    const emailRef = useRef();
    const passwordRef = useRef();
    const passwordConfirmRef = useRef();
    const { signup } = useAuth();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (passwordRef.current.value !== passwordConfirmRef.current.value) {
            return setErrorMessage('Passwords do not match');
        }

        try {
            setErrorMessage('');
            setLoading(true);
            await signup(emailRef.current.value, passwordRef.current.value, nameRef.current.value);
            navigate('/dashboard');
        } catch (error) {
            let message = '';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    message = 'Email already exists';
                    break;
                case 'auth/weak-password':
                    message = 'Password should be at least 6 characters';
                    break;
                default:
                    message = 'Failed to create an account';
            }
            setErrorMessage(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-container">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="auth-title"
                >
                    Create SkillShare Account
                </motion.h2>

                {errorMessage && (
                    <motion.div
                        className="error-message"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {errorMessage}
                    </motion.div>
                )}

                <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <div className="form-group">
                        <motion.input
                            whileFocus={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 400 }}
                            type="text"
                            ref={nameRef}
                            required
                            placeholder="Full Name"
                        />
                    </div>

                    <div className="form-group">
                        <motion.input
                            whileFocus={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 400 }}
                            type="email"
                            ref={emailRef}
                            required
                            placeholder="Email"
                        />
                    </div>

                    <div className="form-group">
                        <motion.input
                            whileFocus={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 400 }}
                            type="password"
                            ref={passwordRef}
                            required
                            placeholder="Password"
                        />
                    </div>

                    <div className="form-group">
                        <motion.input
                            whileFocus={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 400 }}
                            type="password"
                            ref={passwordConfirmRef}
                            required
                            placeholder="Confirm Password"
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={loading}
                        className="auth-button"
                    >
                        {loading ? (
                            <div className="loader"></div>
                        ) : (
                            'Sign Up'
                        )}
                    </motion.button>
                </motion.form>

                <motion.div
                    className="auth-footer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    <p>Already have an account? <Link to="/login">Login</Link></p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Signup;