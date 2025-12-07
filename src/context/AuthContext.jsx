// Folder: src/context
// File: AuthContext.jsx
// Version: 1.8
// Date: December 7, 2025
// Time: 3:30 PM EST

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInWithCustomToken, 
    signInAnonymously, 
    signInWithPopup,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPhoneNumber,
    onAuthStateChanged, 
    signOut 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// FIX: Removed external import. Defining configuration locally to resolve build path errors.
// import { firebaseConfig } from '../firebase-config.js'; 

// ----------------------------------------------------------------------
// 🛑 CRITICAL: PASTE YOUR FIREBASE CONFIGURATION HERE 🛑
// 
// 🚨 IMPORTANT: You MUST replace the value for 'apiKey' below 
//    with the one from your Firebase Project Settings to resolve the 400 error.
// ----------------------------------------------------------------------
const MANUAL_FIREBASE_CONFIG = {
    apiKey: "AIzaSyALrwf4LpQO2R8bTfcrnK04fHhRj0I1Yx8", 
    authDomain: "comicsnap-af94c.firebaseapp.com",
    projectId: "comicsnap-af94c",
    storageBucket: "comicsnap-af94c.firebasestorage.app",
    messagingSenderId: "106369788670",
    appId: "1:106369788670:web:880d3b8b304c67f29193af",
    measurementId: "G-5PGQ6JMSM7"
};
// ----------------------------------------------------------------------

// --- GLOBAL VARIABLES SETUP ---
// Note: These variables are automatically provided by the Canvas environment.
const firebaseConfig = (typeof __firebase_config !== 'undefined' && __firebase_config.length > 2)
    ? JSON.parse(__firebase_config)
    : MANUAL_FIREBASE_CONFIG; // <--- This will use your pasted config if running locally

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Retrieve the initial auth token provided by the Canvas/Environment
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authInitialized, setAuthInitialized] = useState(false);
    
    // Initialize Firebase App
    // The SDK handles idempotency, so calling this multiple times is safe in this context
    const app = initializeApp(firebaseConfig);
    // Initialize Services
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    useEffect(() => {
        // 1. Set up the Auth State Listener
        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user ? user : null);
            setLoading(false);
            setAuthInitialized(true); 
        });

        // 2. Perform initial sign-in attempt (runs once)
        const signInInitial = async () => {
            try {
                if (initialAuthToken) {
                    console.log('Attempting sign-in with custom token...');
                    await signInWithCustomToken(auth, initialAuthToken);
                } 
                // We do NOT sign in anonymously automatically anymore.
                else {
                    console.log("No custom token. Waiting for user to sign in manually.");
                }
            } catch (error) {
                console.error('Initial authentication failed:', error);
            }
        };

        if (!authInitialized) {
            signInInitial();
        }

        return () => unsubscribe();
    }, []); 

    // --- Auth Actions ---

    const logout = () => {
        return signOut(auth);
    };

    const loginWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    };

    const loginWithApple = () => {
        const provider = new OAuthProvider('apple.com');
        return signInWithPopup(auth, provider);
    };

    const loginWithEmail = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signupWithEmail = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const loginWithPhone = (phoneNumber, appVerifier) => {
        return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    };

    const loginAnonymously = () => {
        return signInAnonymously(auth);
    };

    const value = {
        currentUser,
        loading,
        authInitialized, 
        auth, 
        db, // Expose Firestore DB
        logout,
        loginWithGoogle,
        loginWithApple,
        loginWithEmail,
        signupWithEmail,
        loginWithPhone,
        loginAnonymously  
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
            {loading && (
                <div className="flex justify-center items-center h-screen w-full">
                    <p className="text-xl text-emerald-600">Initializing Authentication...</p>
                </div>
            )}
        </AuthContext.Provider>
    );
};