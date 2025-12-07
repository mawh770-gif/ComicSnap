// Folder: src/components
// File: Login.jsx
// Version: 1.4
// Date: December 7, 2025
// Time: 4:35 PM EST

import React, { useState } from 'react';
// FIX: Updated import extension to .jsx to match the actual source file
import { useAuth } from '../context/AuthContext.jsx'; 
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
} from 'firebase/auth';

const Login = () => {
    // Destructure 'auth' from the context hook.
    const { auth } = useAuth();
    
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Google Sign-In using the auth instance
    const handleGoogleSignIn = async () => {
        setError('');
        setIsProcessing(true);
        try {
            const provider = new GoogleAuthProvider();
            // This will open the popup. If the user closes it, it throws an error.
            // If successful, the AuthContext listener will pick up the user and redirect to Scanner.
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error("Google Auth Error:", err);
            // Customize error message for common popup closure
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Sign-in cancelled. You closed the popup.');
            } else {
                setError(`Google Sign-In Failed: ${err.message}`);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    // Email/Password Auth
    const handleEmailAuthSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsProcessing(true);

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            console.error("Email Auth Error:", err);
            let message = err.code ? err.code.replace('auth/', '').replace(/-/g, ' ') : err.message;
            message = message.charAt(0).toUpperCase() + message.slice(1);
            setError(`Error: ${message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleMode = () => {
        setIsLoginMode(prev => !prev);
        setError('');
    };

    const title = isLoginMode ? 'Sign In to Comic Scan Pro' : 'Create New Account';
    const buttonText = isLoginMode ? 'Sign In' : 'Sign Up';
    const toggleText = isLoginMode ? "Need an account? Sign Up" : "Already have an account? Sign In";

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-md w-full">
                <h1 className="text-3xl font-bold text-emerald-700 text-center mb-6">{title}</h1>
                
                {/* Google Sign In Section */}
                <div className="mb-6">
                    <button 
                        onClick={handleGoogleSignIn}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-md text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out disabled:opacity-50">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_of_Google_G_suite.png" alt="Google logo" className="w-5 h-5 mr-3" />
                        Sign In with Google
                    </button>
                </div>

                <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg text-center mb-4 border border-red-200">{error}</div>}

                <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" id="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 text-sm border focus:ring-emerald-500 focus:border-emerald-500" 
                            placeholder="you@example.com" disabled={isProcessing} />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" id="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 text-sm border focus:ring-emerald-500 focus:border-emerald-500" 
                            placeholder="********" disabled={isProcessing} />
                    </div>
                    
                    <button type="submit" disabled={isProcessing}
                            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-150 ease-in-out disabled:opacity-50">
                        {isProcessing ? 'Processing...' : buttonText}
                    </button>
                </form>

                <p className="text-center mt-6 text-sm">
                    <button onClick={toggleMode} className="font-medium text-emerald-600 hover:text-emerald-500">
                        {toggleText}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;