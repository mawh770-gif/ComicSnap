// src/context/AuthContext.jsx - SLIGHTLY REVISED FOR CLEANER APP.JSX
import React, { useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth'; 
import { auth } from '../firebase'; 
// Note: We are no longer using the WelcomeScreen component here. 
// App.jsx will handle the 'loading' state rendering.

const AuthContext = React.createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false); 
        });

        // Cleanup function
        return () => unsubscribe();
    }, []);

    // We can also add login/signup functions here if we want to expose them
    const value = {
        currentUser,
        loading,
        // login: (email, password) => signInWithEmailAndPassword(auth, email, password),
        // signup: (email, password) => createUserWithEmailAndPassword(auth, email, password),
    };

    return (
        <AuthContext.Provider value={value}>
            {children} 
        </AuthContext.Provider>
    );
};