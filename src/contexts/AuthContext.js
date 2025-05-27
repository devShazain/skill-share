import React, { createContext, useContext, useState, useEffect } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
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
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update profile with display name
            await updateProfile(userCredential.user, {
                displayName: name
            });

            // Create initial user document in Firestore
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

    const value = {
        currentUser,
        signup,
        login,
        logout,
        error,
        setError
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}