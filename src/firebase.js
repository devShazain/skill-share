import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    // Replace with your Firebase project configuration
    apiKey: "AIzaSyD__4wOCquAjsR8Sd_64QYFqc7L2agIi4A",
    authDomain: "skill-share-83ef8.firebaseapp.com",
    projectId: "skill-share-83ef8",
    storageBucket: "skill-share-83ef8.firebasestorage.app",
    messagingSenderId: "1055962311819",
    appId: "1:1055962311819:web:4234774b5a05d319a0b88e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;