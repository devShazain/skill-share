import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD__4wOCquAjsR8Sd_64QYFqc7L2agIi4A",
    authDomain: "skill-share-83ef8.firebaseapp.com",
    projectId: "skill-share-83ef8",
    storageBucket: "skill-share-83ef8.appspot.com",
    messagingSenderId: "1055962311819",
    appId: "1:1055962311819:web:4234774b5a05d319a0b88e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with improved configuration
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    useFetchStreams: false,
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

export const storage = getStorage(app);
export default app;