import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import '../styles/UserProfile.css';

const UserProfile = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [newSkill, setNewSkill] = useState('');
    const [skillType, setSkillType] = useState('teach');
    const [showSkillInput, setShowSkillInput] = useState(false);
    const [saving, setSaving] = useState(false);
    const [cropMode, setCropMode] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');
    const fileInputRef = useRef(null);
    const cropperRef = useRef(null);

    // User profile data
    const [userData, setUserData] = useState({
        displayName: '',
        bio: '',
        photoURL: '',
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
        const fetchUserData = async () => {
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData({
                        displayName: data.displayName || currentUser.displayName || '',
                        bio: data.bio || '',
                        photoURL: data.photoURL || currentUser.photoURL || '',
                        teachSkills: data.teachSkills || [],
                        learnSkills: data.learnSkills || [],
                        location: data.location || '',
                        profession: data.profession || '',
                        languages: data.languages || [],
                        experience: data.experience || '',
                        socialLinks: data.socialLinks || {
                            linkedin: '',
                            github: '',
                            twitter: ''
                        }
                    });
                } else {
                    // Create user document if it doesn't exist
                    try {
                        const newUserData = {
                            uid: currentUser.uid,
                            displayName: currentUser.displayName || '',
                            email: currentUser.email,
                            photoURL: currentUser.photoURL || '',
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
                            },
                            createdAt: new Date()
                        };
                        
                        console.log("Creating new user document:", newUserData);
                        await setDoc(userDocRef, newUserData);
                        console.log("New user document created successfully");
                        
                        setUserData({
                            displayName: currentUser.displayName || '',
                            bio: '',
                            photoURL: currentUser.photoURL || '',
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
                    } catch (createError) {
                        console.error("Error creating user document:", createError);
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchUserData();
        }
    }, [currentUser]);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setProfileImage(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setCropMode(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedImage) => {
        setImagePreview(croppedImage);
        setCropMode(false);
    };

    const cancelCrop = () => {
        setImagePreview(null);
        setProfileImage(null);
        setCropMode(false);
    };

    const uploadProfileImage = async () => {
        if (!profileImage && !imagePreview) return null;

        setUploadingImage(true);

        try {
            let blob;
            if (typeof imagePreview === 'string' && imagePreview.startsWith('data:')) {
                const response = await fetch(imagePreview);
                blob = await response.blob();
            } else {
                blob = profileImage;
            }

            const storageRef = ref(storage, `profile-images/${currentUser.uid}_${Date.now()}`);
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        } finally {
            setUploadingImage(false);
        }
    };

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

    const handleAddLanguage = (language) => {
        if (language.trim() && !userData.languages.includes(language.trim())) {
            setUserData({
                ...userData,
                languages: [...userData.languages, language.trim()]
            });
        }
    };

    const handleRemoveLanguage = (language) => {
        setUserData({
            ...userData,
            languages: userData.languages.filter(l => l !== language)
        });
    };

    const handleSocialLinkChange = (platform, value) => {
        setUserData({
            ...userData,
            socialLinks: {
                ...userData.socialLinks,
                [platform]: value
            }
        });
    };

    const handleSaveProfile = async () => {
        console.log('Save button clicked');
        setSaving(true);
        setSaveSuccess(false);
        setSaveError('');
        
        try {
            if (!currentUser) {
                console.error('No user is currently logged in');
                throw new Error('No user is currently logged in');
            }

            console.log('Current user:', currentUser.uid);
            console.log('Starting profile save...', { userData });
            
            // Handle image upload if needed
            let photoURL = userData.photoURL;
            if (profileImage || imagePreview) {
                console.log('Uploading new profile image...');
                const uploadedURL = await uploadProfileImage();
                if (uploadedURL) {
                    photoURL = uploadedURL;
                    console.log('New profile image uploaded:', photoURL);
                } else {
                    console.log('No new image URL received');
                }
            }

            // Prepare the update data
            const updateData = {
                displayName: userData.displayName || '',
                bio: userData.bio || '',
                photoURL: photoURL || '',
                teachSkills: userData.teachSkills || [],
                learnSkills: userData.learnSkills || [],
                location: userData.location || '',
                profession: userData.profession || '',
                languages: userData.languages || [],
                experience: userData.experience || '',
                socialLinks: userData.socialLinks || {
                    linkedin: '',
                    github: '',
                    twitter: ''
                },
                updatedAt: new Date()
            };

            console.log('Updating Firestore with data:', updateData);

            // Update Firestore
            const userDocRef = doc(db, 'users', currentUser.uid);
            console.log('User document reference:', userDocRef.path);
            
            await updateDoc(userDocRef, updateData);
            console.log('Firestore update successful');

            // Update local state
            setUserData(prev => ({ ...prev, photoURL }));
            setSaveSuccess(true);
            console.log('Profile saved successfully');

            // Reset form after success
            setTimeout(() => {
                setEditMode(false);
                setProfileImage(null);
                setImagePreview(null);
            }, 2000);

        } catch (error) {
            console.error('Error updating profile:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
            setSaveError(error.message || 'Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
            console.log('Save operation completed');
        }
    };

    const handleCancel = () => {
        // Fetch the current data from Firebase again
        const fetchUserData = async () => {
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData({
                        displayName: data.displayName || currentUser.displayName || '',
                        bio: data.bio || '',
                        photoURL: data.photoURL || currentUser.photoURL || '',
                        teachSkills: data.teachSkills || [],
                        learnSkills: data.learnSkills || [],
                        location: data.location || '',
                        profession: data.profession || '',
                        languages: data.languages || [],
                        experience: data.experience || '',
                        socialLinks: data.socialLinks || {
                            linkedin: '',
                            github: '',
                            twitter: ''
                        }
                    });
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
        setEditMode(false);
        setProfileImage(null);
        setImagePreview(null);
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
                <div className="profile-header">
                    <motion.h2
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        {editMode ? 'Edit Profile' : 'User Profile'}
                    </motion.h2>
                    <motion.button
                        className={`edit-toggle-button ${editMode ? 'cancel' : 'edit'}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => editMode ? handleCancel() : setEditMode(true)}
                    >
                        {editMode ? 'Cancel' : 'Edit Profile'}
                    </motion.button>
                </div>

                <div className="profile-content">
                    <div className="profile-main">
                        <div className="profile-image-section">
                            <div className="profile-image-container">
                                {editMode && !cropMode && (
                                    <label className="image-upload-label">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="image-upload-input"
                                            ref={fileInputRef}
                                        />
                                        <div className="upload-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M16 16v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1"></path>
                                                <polygon points="21 15 16 10 5 21"></polygon>
                                                <circle cx="17.5" cy="6.5" r="2.5"></circle>
                                            </svg>
                                            <span>Upload Photo</span>
                                        </div>
                                    </label>
                                )}
                                {cropMode ? (
                                    <div className="crop-container">
                                        <div className="crop-preview">
                                            <img 
                                                src={imagePreview} 
                                                alt="Preview" 
                                                ref={cropperRef}
                                                className="crop-image"
                                            />
                                        </div>
                                        <div className="crop-controls">
                                            <button 
                                                className="crop-button confirm"
                                                onClick={() => handleCropComplete(imagePreview)}
                                            >
                                                Confirm
                                            </button>
                                            <button 
                                                className="crop-button cancel"
                                                onClick={cancelCrop}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <img
                                        src={imagePreview || userData.photoURL || 'https://via.placeholder.com/150?text=Profile'}
                                        alt="Profile"
                                        className="profile-image"
                                    />
                                )}
                            </div>
                            <div className="profile-name">
                                {editMode ? (
                                    <input
                                        type="text"
                                        value={userData.displayName}
                                        onChange={(e) => setUserData({ ...userData, displayName: e.target.value })}
                                        placeholder="Your name"
                                        className="name-input"
                                    />
                                ) : (
                                    <h3>{userData.displayName || 'User'}</h3>
                                )}
                                {editMode ? (
                                    <div className="input-group">
                                        <span className="input-icon">🧑‍💼</span>
                                        <input
                                            type="text"
                                            value={userData.profession}
                                            onChange={(e) => setUserData({ ...userData, profession: e.target.value })}
                                            placeholder="Your profession"
                                            className="profession-input"
                                        />
                                    </div>
                                ) : (
                                    userData.profession && (
                                        <p className="user-profession">{userData.profession}</p>
                                    )
                                )}
                            </div>
                        </div>

                        <div className="profile-details">
                            <div className="bio-section">
                                <h4>About Me</h4>
                                {editMode ? (
                                    <textarea
                                        value={userData.bio}
                                        onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                                        placeholder="Tell us about yourself"
                                        rows="4"
                                        className="bio-input"
                                    />
                                ) : (
                                    <p className="bio">{userData.bio || 'No bio provided yet.'}</p>
                                )}
                            </div>

                            <div className="additional-info">
                                <div className="info-group">
                                    <h4>Location</h4>
                                    {editMode ? (
                                        <div className="input-group">
                                            <span className="input-icon">📍</span>
                                            <input
                                                type="text"
                                                value={userData.location}
                                                onChange={(e) => setUserData({ ...userData, location: e.target.value })}
                                                placeholder="Your location"
                                            />
                                        </div>
                                    ) : (
                                        <p>{userData.location || 'Not specified'}</p>
                                    )}
                                </div>

                                <div className="info-group">
                                    <h4>Languages</h4>
                                    {editMode ? (
                                        <div className="languages-edit">
                                            <div className="input-group">
                                                <span className="input-icon">🗣️</span>
                                                <input
                                                    type="text"
                                                    placeholder="Add a language"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleAddLanguage(e.target.value);
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="tags-container">
                                                {userData.languages.map((lang, index) => (
                                                    <div key={index} className="tag">
                                                        {lang}
                                                        <button 
                                                            className="remove-tag" 
                                                            onClick={() => handleRemoveLanguage(lang)}
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="languages-display">
                                            {userData.languages.length > 0 ? (
                                                <div className="tags-container">
                                                    {userData.languages.map((lang, index) => (
                                                        <span key={index} className="tag">{lang}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p>Not specified</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="info-group">
                                    <h4>Experience</h4>
                                    {editMode ? (
                                        <textarea
                                            value={userData.experience}
                                            onChange={(e) => setUserData({ ...userData, experience: e.target.value })}
                                            placeholder="Share your experience"
                                            rows="3"
                                            className="experience-input"
                                        />
                                    ) : (
                                        <p>{userData.experience || 'Not specified'}</p>
                                    )}
                                </div>

                                <div className="info-group">
                                    <h4>Social Links</h4>
                                    {editMode ? (
                                        <div className="social-links-edit">
                                            <div className="input-group">
                                                <span className="input-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                                </span>
                                                <input
                                                    type="text"
                                                    value={userData.socialLinks.linkedin}
                                                    onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                                                    placeholder="LinkedIn URL"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <span className="input-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                                                </span>
                                                <input
                                                    type="text"
                                                    value={userData.socialLinks.github}
                                                    onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                                                    placeholder="GitHub URL"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <span className="input-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                                                </span>
                                                <input
                                                    type="text"
                                                    value={userData.socialLinks.twitter}
                                                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                                                    placeholder="Twitter URL"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="social-links-display">
                                            {(userData.socialLinks.linkedin || userData.socialLinks.github || userData.socialLinks.twitter) ? (
                                                <div className="social-links">
                                                    {userData.socialLinks.linkedin && (
                                                        <a href={userData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                                            LinkedIn
                                                        </a>
                                                    )}
                                                    {userData.socialLinks.github && (
                                                        <a href={userData.socialLinks.github} target="_blank" rel="noopener noreferrer" className="social-link">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                                                            GitHub
                                                        </a>
                                                    )}
                                                    {userData.socialLinks.twitter && (
                                                        <a href={userData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="social-link">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                                                            Twitter
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <p>No social links added</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="skills-section">
                        <div className="skills-column">
                            <div className="skills-header">
                                <h3>Skills I Can Teach</h3>
                                {editMode && (
                                    <button 
                                        className="add-skill-button"
                                        onClick={() => {
                                            setSkillType('teach');
                                            setShowSkillInput(true);
                                            setNewSkill('');
                                        }}
                                    >
                                        + Add Skill
                                    </button>
                                )}
                            </div>
                            <AnimatePresence>
                                {showSkillInput && skillType === 'teach' && (
                                    <motion.div 
                                        className="add-skill-form"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <input
                                            type="text"
                                            value={newSkill}
                                            onChange={(e) => setNewSkill(e.target.value)}
                                            placeholder="Add a skill"
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                                            autoFocus
                                        />
                                        <div className="skill-form-buttons">
                                            <button onClick={handleAddSkill}>Add</button>
                                            <button onClick={() => setShowSkillInput(false)}>Cancel</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div className="skills-list">
                                {userData.teachSkills.length > 0 ? (
                                    <motion.div
                                        className="skill-tags"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        {userData.teachSkills.map((skill, index) => (
                                            <motion.div 
                                                key={index} 
                                                className="skill-tag"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                {skill}
                                                {editMode && (
                                                    <button
                                                        className="remove-skill"
                                                        onClick={() => handleRemoveSkill(skill, 'teach')}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <p className="no-skills">No skills added yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="skills-column">
                            <div className="skills-header">
                                <h3>Skills I Want to Learn</h3>
                                {editMode && (
                                    <button 
                                        className="add-skill-button"
                                        onClick={() => {
                                            setSkillType('learn');
                                            setShowSkillInput(true);
                                            setNewSkill('');
                                        }}
                                    >
                                        + Add Skill
                                    </button>
                                )}
                            </div>
                            <AnimatePresence>
                                {showSkillInput && skillType === 'learn' && (
                                    <motion.div 
                                        className="add-skill-form"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <input
                                            type="text"
                                            value={newSkill}
                                            onChange={(e) => setNewSkill(e.target.value)}
                                            placeholder="Add a skill"
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                                            autoFocus
                                        />
                                        <div className="skill-form-buttons">
                                            <button onClick={handleAddSkill}>Add</button>
                                            <button onClick={() => setShowSkillInput(false)}>Cancel</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div className="skills-list">
                                {userData.learnSkills.length > 0 ? (
                                    <motion.div
                                        className="skill-tags"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        {userData.learnSkills.map((skill, index) => (
                                            <motion.div 
                                                key={index} 
                                                className="skill-tag"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                {skill}
                                                {editMode && (
                                                    <button
                                                        className="remove-skill"
                                                        onClick={() => handleRemoveSkill(skill, 'learn')}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <p className="no-skills">No skills added yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {editMode && (
                        <div className="profile-actions">
                            {saveSuccess && (
                                <motion.div 
                                    className="save-success"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <span className="success-icon">✅</span>
                                    Profile saved successfully!
                                </motion.div>
                            )}
                            
                            {saveError && (
                                <motion.div 
                                    className="save-error"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <span className="error-icon">⚠️</span>
                                    {saveError}
                                </motion.div>
                            )}
                            
                            <motion.button
                                className={`save-button ${saveSuccess ? 'success' : ''}`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSaveProfile()}
                                disabled={saving || uploadingImage || saveSuccess}
                            >
                                {saving || uploadingImage ? (
                                    <div className="button-loader">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                ) : saveSuccess ? (
                                    <>
                                        <span className="success-icon">✓</span>
                                        Saved!
                                    </>
                                ) : 'Save Profile'}
                            </motion.button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default UserProfile;