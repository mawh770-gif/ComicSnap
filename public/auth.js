import React, { useState, useEffect, useContext } from 'react';
import { getAuth, onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth'; 
import { initializeApp } from 'firebase/app';
// The build script expects firebase.js to be available for imports.
// FIX: Added the .js extension to resolve the module path correctly.
import { firebaseConfig } from '../firebase.js'; 

// --- Initialization ---
// We need to initialize the app here to get the 'auth' object
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Use the global custom token if available (provided by the Canvas environment)
// This ensures the user is signed in immediately on load.
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// The AuthContext is the primary hook for accessing user state
const AuthContext = React.createContext();

// Hook to consume the auth context easily
export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authInitialized, setAuthInitialized] = useState(false);

    // 1. Initial Sign-in with Custom Token
    useEffect(() => {
        const handleAuth = async () => {
            try {
                if (initialAuthToken) {
                    // Sign in using the custom token provided by the environment
                    await signInWithCustomToken(auth, initialAuthToken);
                    console.log("Signed in successfully using Canvas custom token.");
                } else {
                    // If no custom token is provided, the user is considered unauthenticated
                    // We DO NOT use signInAnonymously here, adhering to your preference.
                    console.log("No custom token available. User must sign in via UI if not already authenticated.");
                }
            } catch (error) {
                console.error("Authentication setup error:", error.message);
                // Even on error, we proceed to watch the auth state
            } finally {
                setAuthInitialized(true);
            }
        };

        handleAuth();
    }, []);


    // 2. Authentication State Listener (runs after initialization)
    useEffect(() => {
        if (!authInitialized) return;

        // Set up the listener to track user state changes (login/logout)
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            // The user object is null if signed out, or contains user data if signed in.
            setCurrentUser(user);
            // Once the auth state has been checked (either logged in or logged out), we stop loading.
            setLoading(false); 
        });

        // Cleanup function: stop listening when the component unmounts
        return () => unsubscribe();
    }, [authInitialized]);


    // Public functions to expose via context
    const value = {
        currentUser,
        loading,
        auth, // Expose the auth object for sign-out or future login implementation
        // Simplified sign-out function
        logout: () => {
            setLoading(true);
            return signOut(auth);
        },
    };

    return (
        <AuthContext.Provider value={value}>
            {/* We render children only after the initial auth state is checked */}
            {!loading && children}
            {loading && (
                <div className="flex justify-center items-center h-screen w-full">
                    <p className="text-xl text-emerald-600">Initializing Authentication...</p>
                </div>
            )}
        </AuthContext.Provider>
    );
};