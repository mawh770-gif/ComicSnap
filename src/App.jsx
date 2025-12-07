// Folder: src
// File: App.jsx
// Version: 1.5
// Date: December 7, 2025
// Time: 3:55 PM EST

import React from 'react';
// FIX: Updated import extension to .jsx to match the actual file name
import { useAuth } from './context/AuthContext.jsx'; 

// Import the components
import Login from './components/Login.jsx';
import Scanner from './components/Scanner.jsx';

const App = () => {
    const { currentUser, loading, authInitialized } = useAuth();

    // 1. Loading State
    if (loading || !authInitialized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-emerald-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-xl text-gray-600 font-medium">Loading Application...</p>
                </div>
            </div>
        );
    }

    // 2. Unauthenticated State (Show Login Screen)
    if (!currentUser) {
        return <Login />;
    }

    // 3. Authenticated State (Show Scanner/Dashboard)
    return <Scanner />;
};

export default App;