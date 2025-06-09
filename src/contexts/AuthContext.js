import React, { createContext, useContext, useState, useEffect } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "firebase/auth";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
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

            try {
                // Then create the user document in Firestore
                await setDoc(doc(db, 'users', userCredential.user.uid), {
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
                    createdAt: new Date()
                });
            } catch (firestoreError) {
                console.error("Error creating user document:", firestoreError);
                // Continue anyway - we can create the document later
            }

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
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("Auth state changed:", user ? user.uid : "No user");
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Add this function to update user profile
    async function updateUserData(updates) {
        if (!currentUser) throw new Error("No user logged in");
        
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            
            // First, check if the document exists
            const docSnap = await getDoc(userRef);
            
            if (docSnap.exists()) {
                // Update existing document
                await updateDoc(userRef, updates);
            } else {
                // Create document if it doesn't exist
                await setDoc(userRef, {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    ...updates,
                    createdAt: new Date()
                });
            }
            
            // If displayName or photoURL is updated, also update auth profile
            if (updates.displayName || updates.photoURL) {
                await updateProfile(currentUser, {
                    displayName: updates.displayName || currentUser.displayName,
                    photoURL: updates.photoURL || currentUser.photoURL
                });
            }
            
            return true;
        } catch (error) {
            console.error("Error updating user data:", error);
            throw error;
        }
    }

    // Add session persistence check
    async function checkAuthStatus() {
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                resolve(user);
            });
        });
    }

    const value = {
        currentUser,
        signup,
        login,
        logout,
        error,
        setError,
        updateUserData,  // Add this
        checkAuthStatus  // Add this
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}