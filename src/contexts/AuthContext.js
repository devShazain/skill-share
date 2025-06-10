import React, { createContext, useContext, useState, useEffect } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "firebase/auth";
import { doc, setDoc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function signup(email, password, name) {
        try {
            // First create the authentication user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update profile with display name
            await updateProfile(userCredential.user, {
                displayName: name
            });

            // Create the user document in Firestore
            const userData = {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: name,
                photoURL: '',
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
                createdAt: new Date(),
                lastUpdated: new Date()
            };

            await setDoc(doc(db, 'users', userCredential.user.uid), userData);
            console.log("User document created successfully");

            return userCredential;
        } catch (error) {
            console.error("Error in signup:", error);
            throw error;
        }
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        setUserProfile(null);
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("Auth state changed:", user ? user.uid : "No user");
            setCurrentUser(user);
            
            if (user) {
                // Set up real-time listener for user profile data
                const userDocRef = doc(db, 'users', user.uid);
                
                const unsubscribeProfile = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        const profileData = doc.data();
                        setUserProfile(profileData);
                        console.log("User profile loaded:", profileData);
                    } else {
                        console.log("No user profile found, will create one");
                        setUserProfile(null);
                    }
                }, (error) => {
                    console.error("Error listening to user profile:", error);
                    setUserProfile(null);
                });

                // Store the unsubscribe function
                user.unsubscribeProfile = unsubscribeProfile;
            } else {
                setUserProfile(null);
            }
            
            setLoading(false);
        });

        return () => {
            unsubscribe();
            // Clean up profile listener if it exists
            if (currentUser && currentUser.unsubscribeProfile) {
                currentUser.unsubscribeProfile();
            }
        };
    }, []);

    // Enhanced updateUserData function
    async function updateUserData(updates) {
        if (!currentUser) throw new Error("No user logged in");
        
        try {
            console.log("Updating user data:", updates);
            const userRef = doc(db, 'users', currentUser.uid);
            
            // Prepare the update data
            const updateData = {
                ...updates,
                lastUpdated: new Date()
            };

            // First, check if the document exists
            const docSnap = await getDoc(userRef);
            
            if (docSnap.exists()) {
                // Update existing document
                await updateDoc(userRef, updateData);
                console.log("User document updated successfully");
            } else {
                // Create document if it doesn't exist
                const newUserData = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName || '',
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
                    createdAt: new Date(),
                    ...updateData
                };
                
                await setDoc(userRef, newUserData);
                console.log("User document created successfully");
            }
            
            // If displayName or photoURL is updated, also update auth profile
            if (updates.displayName || updates.photoURL) {
                await updateProfile(currentUser, {
                    displayName: updates.displayName || currentUser.displayName,
                    photoURL: updates.photoURL || currentUser.photoURL
                });
                console.log("Auth profile updated successfully");
            }
            
            return true;
        } catch (error) {
            console.error("Error updating user data:", error);
            throw error;
        }
    }

    // Function to create user profile if it doesn't exist
    async function ensureUserProfile() {
        if (!currentUser) return null;
        
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(userRef);
            
            if (!docSnap.exists()) {
                const userData = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName || '',
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
                    createdAt: new Date(),
                    lastUpdated: new Date()
                };
                
                await setDoc(userRef, userData);
                console.log("User profile created automatically");
                return userData;
            }
            
            return docSnap.data();
        } catch (error) {
            console.error("Error ensuring user profile:", error);
            return null;
        }
    }

    const value = {
        currentUser,
        userProfile,
        signup,
        login,
        logout,
        error,
        setError,
        updateUserData,
        ensureUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}