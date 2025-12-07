// src/firebase.js
// This file centralizes the Firebase configuration and exports it for use 
// by client-side files like AuthContext.jsx.

// The __firebase_config variable is provided by the Canvas environment.
const firebaseConfig = JSON.parse(
    typeof __firebase_config !== 'undefined' ? __firebase_config : '{}'
);

// We export the configuration object.
// The actual initialization (initializeApp, getAuth, etc.) is handled in AuthContext.jsx.
export { firebaseConfig };