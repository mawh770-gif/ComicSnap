// Folder: src
// File: firebase-config.js
// Version: 1.3
// Date: December 7, 2025
// Time: 1:37 PM EST

// Simulating a real firebase-config.js file that initializes the app and exports services.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Your Comic Scan Pro Firebase Project Configuration
// This hardcoded config works for both Local testing and Public deployment.
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyALrwf4LpQO2R8bTfcrnK04fHhRj0I1Yx8",
    authDomain: "comicsnap-af94c.firebaseapp.com",
    projectId: "comicsnap-af94c",
    storageBucket: "comicsnap-af94c.firebasestorage.app",
    messagingSenderId: "106369788670",
    appId: "1:106369788670:web:880d3b8b304c67f29193af",
    measurementId: "G-5PGQ6JMSM7"
};

// 1. Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);

// 2. Initialize Services
const auth = getAuth(app);
const functions = getFunctions(app, 'us-central1');
const db = getFirestore(app);

console.log("Comic Scan Pro Firebase services initialized.");

// 3. Exports
// CRITICAL: We export 'app' so other services (like comicService.js) can use it if needed.
export { app, auth, functions, db };