import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration may have an incorrect storage bucket name
// Firebase Storage buckets typically use the format: projectId.appspot.com
const firebaseConfig = {
    // Replace with your Firebase project configuration
    apiKey: "AIzaSyD__4wOCquAjsR8Sd_64QYFqc7L2agIi4A",
    authDomain: "skill-share-83ef8.firebaseapp.com",
    projectId: "skill-share-83ef8",
    storageBucket: "skill-share-83ef8.appspot.com", // Changed to standard format
    messagingSenderId: "1055962311819",
    appId: "1:1055962311819:web:4234774b5a05d319a0b88e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;