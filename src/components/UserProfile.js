import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import '../styles/UserProfile.css';

const UserProfile = () => {
    const { currentUser, userProfile, updateUserData, ensureUserProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [newSkill, setNewSkill] = useState('');
    const [skillType, setSkillType] = useState('teach');
    const [showSkillInput, setShowSkillInput] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');

    // User profile data
    const [userData, setUserData] = useState({
        displayName: '',
        bio: '',
        teachSkills: [],
        learnSkills: [],
        location: '',
        profession: '',
        languages: [],
        experience: '',
        socialLinks: {
            linkedin: '',
            github: '',
            twitter: ''
        }
    });

    useEffect(() => {
        const initializeProfile = async () => {
            try {
                setLoading(true);
                
                // Ensure profile exists
                await ensureUserProfile();
                
                // Use userProfile from context if available
                if (userProfile) {
                    setUserData({
                        displayName: userProfile.displayName || currentUser.displayName || '',
                        bio: userProfile.bio || '',
                        teachSkills: userProfile.teachSkills || [],
                        learnSkills: userProfile.learnSkills || [],
                        location: userProfile.location || '',
                        profession: userProfile.profession || '',
                        languages: userProfile.languages || [],
                        experience: userProfile.experience || '',
                        socialLinks: userProfile.socialLinks || {
                            linkedin: '',
                            github: '',
                            twitter: ''
                        }
                    });
                } else {
                    // Set default values if no profile exists
                    setUserData({
                        displayName: currentUser.displayName || '',
                        bio: '',
                        teachSkills: [],
                        learnSkills: [],
                        location: '',
                        profession: '',
                        languages: [],
                        experience: '',
                        socialLinks: {
                            linkedin: '',
                            github: '',
                            twitter: ''
                        }
                    });
                }
            } catch (error) {
                console.error('Error initializing profile:', error);
                setSaveError('Failed to load profile data.');
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            initializeProfile();
        }
    }, [currentUser, userProfile, ensureUserProfile]);

    const handleAddSkill = () => {
        if (newSkill.trim()) {
            const skillKey = skillType === 'teach' ? 'teachSkills' : 'learnSkills';
            
            if (!userData[skillKey].includes(newSkill.trim())) {
                setUserData({
                    ...userData,
                    [skillKey]: [...userData[skillKey], newSkill.trim()]
                });
                setNewSkill('');
                setShowSkillInput(false);
            }
        }
    };

    const handleRemoveSkill = (skill, type) => {
        const skillKey = type === 'teach' ? 'teachSkills' : 'learnSkills';
        setUserData({
            ...userData,
            [skillKey]: userData[skillKey].filter(s => s !== skill)
        });
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            setSaveError('');
            setSaveSuccess(false);
            
            console.log("Starting profile save...");
            console.log("Current user:", currentUser.uid);
            console.log("Profile data to save:", userData);
            
            // Prepare data for Firestore - make sure it's serializable
            const updateData = {
                displayName: userData.displayName?.trim() || '',
                bio: userData.bio?.trim() || '',
                teachSkills: userData.teachSkills || [],
                learnSkills: userData.learnSkills || [],
                location: userData.location?.trim() || '',
                profession: userData.profession?.trim() || '',
                languages: userData.languages || [],
                experience: userData.experience?.trim() || '',
                socialLinks: userData.socialLinks || {
                    linkedin: '',
                    github: '',
                    twitter: ''
                }
            };
            
            console.log("Cleaned data for Firestore:", updateData);
            
            // Use AuthContext's updateUserData function
            await updateUserData(updateData);
            
            console.log("Profile saved successfully via AuthContext");
            
            setSaveSuccess(true);
            setEditMode(false);
            
            // Reset success message after 3 seconds
            setTimeout(() => setSaveSuccess(false), 3000);
            
        } catch (error) {
            console.error('Error saving profile:', error);
            setSaveError(`Failed to save profile: ${error.message}`);
            
            // Reset error message after 5 seconds
            setTimeout(() => setSaveError(''), 5000);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        // Reset to current profile data
        if (userProfile) {
            setUserData({
                displayName: userProfile.displayName || currentUser.displayName || '',
                bio: userProfile.bio || '',
                teachSkills: userProfile.teachSkills || [],
                learnSkills: userProfile.learnSkills || [],
                location: userProfile.location || '',
                profession: userProfile.profession || '',
                languages: userProfile.languages || [],
                experience: userProfile.experience || '',
                socialLinks: userProfile.socialLinks || {
                    linkedin: '',
                    github: '',
                    twitter: ''
                }
            });
        }
        
        setEditMode(false);
        setSaveError('');
        setSaveSuccess(false);
    };

    if (loading) {
        return (
            <div className="profile-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <motion.div
                className="profile-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div className="profile-header">
                    <motion.h2
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="profile-title"
                    >
                        {editMode ? 'Edit Profile' : 'User Profile'}
                    </motion.h2>
                    <motion.button
                        className={`edit-toggle-button ${editMode ? 'cancel' : 'edit'}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => editMode ? handleCancel() : setEditMode(true)}
                        disabled={saving}
                    >
                        {editMode ? 'Cancel' : 'Edit Profile'}
                    </motion.button>
                </div>

                {/* Success/Error Messages */}
                <AnimatePresence>
                    {saveSuccess && (
                        <motion.div
                            className="success-message"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            ✅ Profile saved successfully!
                        </motion.div>
                    )}
                    {saveError && (
                        <motion.div
                            className="error-message"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            ❌ {saveError}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Profile Content */}
                <div className="profile-content">
                    {/* Left Side - Avatar and Name */}
                    <div className="profile-left">
                        <div className="profile-avatar-section">
                            <div className="profile-avatar-container">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'User')}&background=6366f1&color=white&size=200`}
                                    alt="Profile"
                                    className="profile-avatar"
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'User')}&background=6366f1&color=white&size=200`;
                                    }}
                                />
                            </div>
                            <div className="profile-name-section">
                                {editMode ? (
                                    <>
                                        <input
                                            type="text"
                                            value={userData.displayName}
                                            onChange={(e) => setUserData({ ...userData, displayName: e.target.value })}
                                            placeholder="Your name"
                                            className="name-input"
                                        />
                                        <input
                                            type="text"
                                            value={userData.profession}
                                            onChange={(e) => setUserData({ ...userData, profession: e.target.value })}
                                            placeholder="Your profession"
                                            className="profession-input"
                                        />
                                    </>
                                ) : (
                                    <h3 className="profile-name">{userData.displayName || 'User'}</h3>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Profile Details */}
                    <div className="profile-right">
                        {/* About Me */}
                        <div className="profile-section">
                            <h4 className="section-title">About Me</h4>
                            {editMode ? (
                                <textarea
                                    value={userData.bio}
                                    onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                                    placeholder="Tell us about yourself"
                                    className="bio-textarea"
                                    rows={4}
                                />
                            ) : (
                                <p className="section-content">{userData.bio || 'No bio provided yet.'}</p>
                            )}
                        </div>

                        {/* Location and Languages Row */}
                        <div className="profile-row">
                            <div className="profile-section half">
                                <h4 className="section-title">Location</h4>
                                {editMode ? (
                                    <div className="input-with-icon">
                                        <span className="input-icon">📍</span>
                                        <input
                                            type="text"
                                            value={userData.location}
                                            onChange={(e) => setUserData({ ...userData, location: e.target.value })}
                                            placeholder="Your location"
                                            className="location-input"
                                        />
                                    </div>
                                ) : (
                                    <p className="section-content">{userData.location || 'Not specified'}</p>
                                )}
                            </div>
                            <div className="profile-section half">
                                <h4 className="section-title">Languages</h4>
                                {editMode ? (
                                    <div className="input-with-icon">
                                        <span className="input-icon">🗣️</span>
                                        <input
                                            type="text"
                                            value={userData.languages.join(', ')}
                                            onChange={(e) => setUserData({ ...userData, languages: e.target.value.split(',').map(lang => lang.trim()).filter(lang => lang) })}
                                            placeholder="Add a language"
                                            className="languages-input"
                                        />
                                    </div>
                                ) : (
                                    <p className="section-content">{userData.languages.length > 0 ? userData.languages.join(', ') : 'Not specified'}</p>
                                )}
                            </div>
                        </div>

                        {/* Experience and Social Links Row */}
                        <div className="profile-row">
                            <div className="profile-section half">
                                <h4 className="section-title">Experience</h4>
                                {editMode ? (
                                    <textarea
                                        value={userData.experience}
                                        onChange={(e) => setUserData({ ...userData, experience: e.target.value })}
                                        placeholder="Share your experience"
                                        className="experience-textarea"
                                        rows={3}
                                    />
                                ) : (
                                    <p className="section-content">{userData.experience || 'Not specified'}</p>
                                )}
                            </div>
                            <div className="profile-section half">
                                <h4 className="section-title">Social Links</h4>
                                {editMode ? (
                                    <div className="social-inputs">
                                        <div className="input-with-icon">
                                            <span className="input-icon">💼</span>
                                            <input
                                                type="text"
                                                value={userData.socialLinks.linkedin}
                                                onChange={(e) => setUserData({ 
                                                    ...userData, 
                                                    socialLinks: { ...userData.socialLinks, linkedin: e.target.value }
                                                })}
                                                placeholder="LinkedIn URL"
                                                className="social-input"
                                            />
                                        </div>
                                        <div className="input-with-icon">
                                            <span className="input-icon">💻</span>
                                            <input
                                                type="text"
                                                value={userData.socialLinks.github}
                                                onChange={(e) => setUserData({ 
                                                    ...userData, 
                                                    socialLinks: { ...userData.socialLinks, github: e.target.value }
                                                })}
                                                placeholder="GitHub URL"
                                                className="social-input"
                                            />
                                        </div>
                                        <div className="input-with-icon">
                                            <span className="input-icon">🐦</span>
                                            <input
                                                type="text"
                                                value={userData.socialLinks.twitter}
                                                onChange={(e) => setUserData({ 
                                                    ...userData, 
                                                    socialLinks: { ...userData.socialLinks, twitter: e.target.value }
                                                })}
                                                placeholder="Twitter URL"
                                                className="social-input"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="section-content">
                                        {userData.socialLinks.linkedin || userData.socialLinks.github || userData.socialLinks.twitter ? (
                                            <div className="social-links-display">
                                                {userData.socialLinks.linkedin && (
                                                    <a href={userData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">LinkedIn</a>
                                                )}
                                                {userData.socialLinks.github && (
                                                    <a href={userData.socialLinks.github} target="_blank" rel="noopener noreferrer" className="social-link">GitHub</a>
                                                )}
                                                {userData.socialLinks.twitter && (
                                                    <a href={userData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="social-link">Twitter</a>
                                                )}
                                            </div>
                                        ) : (
                                            'No social links added'
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Skills Section */}
                <div className="skills-container">
                    <div className="skills-section">
                        <div className="skills-header">
                            <h4 className="skills-title">Skills I Can Teach</h4>
                            {editMode && (
                                <button
                                    type="button"
                                    className="add-skill-button"
                                    onClick={() => {
                                        setSkillType('teach');
                                        setShowSkillInput(true);
                                    }}
                                >
                                    + Add Skill
                                </button>
                            )}
                        </div>
                        <div className="skills-content">
                            {userData.teachSkills.length > 0 ? (
                                <div className="skills-list">
                                    {userData.teachSkills.map((skill, index) => (
                                        <span key={index} className="skill-tag teach-skill">
                                            {skill}
                                            {editMode && (
                                                <button
                                                    type="button"
                                                    className="remove-skill"
                                                    onClick={() => handleRemoveSkill(skill, 'teach')}
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-skills">No skills added yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="skills-section">
                        <div className="skills-header">
                            <h4 className="skills-title">Skills I Want to Learn</h4>
                            {editMode && (
                                <button
                                    type="button"
                                    className="add-skill-button"
                                    onClick={() => {
                                        setSkillType('learn');
                                        setShowSkillInput(true);
                                    }}
                                >
                                    + Add Skill
                                </button>
                            )}
                        </div>
                        <div className="skills-content">
                            {userData.learnSkills.length > 0 ? (
                                <div className="skills-list">
                                    {userData.learnSkills.map((skill, index) => (
                                        <span key={index} className="skill-tag learn-skill">
                                            {skill}
                                            {editMode && (
                                                <button
                                                    type="button"
                                                    className="remove-skill"
                                                    onClick={() => handleRemoveSkill(skill, 'learn')}
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-skills">No skills added yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Skill Input Modal */}
                <AnimatePresence>
                    {showSkillInput && (
                        <motion.div
                            className="skill-input-modal"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <h5>Add {skillType === 'teach' ? 'Teaching' : 'Learning'} Skill</h5>
                            <input
                                type="text"
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                placeholder="Enter skill name"
                                className="skill-input"
                                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                                autoFocus
                            />
                            <div className="skill-input-actions">
                                <button
                                    type="button"
                                    onClick={() => setShowSkillInput(false)}
                                    className="cancel-skill"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddSkill}
                                    className="add-skill"
                                    disabled={!newSkill.trim()}
                                >
                                    Add Skill
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Save Button */}
                {editMode && (
                    <motion.div
                        className="save-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <button
                            type="button"
                            className="save-profile-button"
                            onClick={handleSaveProfile}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <div className="spinner small"></div>
                                    Saving Profile...
                                </>
                            ) : (
                                'Save Profile'
                            )}
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default UserProfile;