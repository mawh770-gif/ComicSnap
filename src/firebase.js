// src/firebase.js - THE SINGLE SOURCE OF TRUTH

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 1. Your Actual Configuration (Moved from App.jsx)
const firebaseConfig = {
  apiKey: "AIzaSyALrwf4LpQO2R8bTfcrnK04fHhRj0I1Yx8",
  authDomain: "comicsnap-af94c.firebaseapp.com",
  projectId: "comicsnap-af94c",
  storageBucket: "comicsnap-af94c.firebasestorage.app",
  messagingSenderId: "106369788670",
  appId: "1:106369788670:web:880d3b8b304c67f29193af",
  measurementId: "G-5PGQ6JMSM7"
};

// 2. Initialize Firebase
const app = initializeApp(firebaseConfig);

// 3. Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// 4. Export them for use in App.jsx and AuthContext
export { auth, db, storage, googleProvider };