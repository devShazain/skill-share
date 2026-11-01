import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCKr0lXUemGmAJ4w4zUZW5wPa2_gmRkNWo",
    authDomain: "skill-share-fdfb1.firebaseapp.com",
    projectId: "skill-share-fdfb1",
    storageBucket: "skill-share-fdfb1.firebasestorage.app",
    messagingSenderId: "1049995999682",
    appId: "1:1049995999682:web:fe1ee5ef40aa15e386be5b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Test Firebase connection
console.log("Firebase initialized successfully:", {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
});

// Add connection test function
export const testFirebaseConnection = async () => {
    try {
        console.log("Testing Firebase connection...");
        
        // Test Auth
        console.log("Auth instance:", auth);
        
        // Test Firestore
        console.log("Firestore instance:", db);
        
        // Test Storage
        console.log("Storage instance:", storage);
        
        console.log("✅ All Firebase services initialized successfully");
        return true;
    } catch (error) {
        console.error("❌ Firebase connection test failed:", error);
        return false;
    }
};

// Run test immediately
testFirebaseConnection();

export default app;
