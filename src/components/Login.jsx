// src/components/Login.jsx - NEW FILE
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            if (isLoginMode) {
                // LOGIN: Use existing user account
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // SIGNUP: Create new user account
                await createUserWithEmailAndPassword(auth, email, password);
            }
            // App.jsx will automatically detect the currentUser change and switch to Scanner.
        } catch (err) {
            console.error(err);
            // Display a user-friendly error message
            setError(`Error: ${err.message.includes('auth/') ? err.message.split('auth/')[1].replace(/[-()]/g, ' ') : 'Invalid credentials.'}`);
        }
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setError('');
    };

    return (
        <div style={{ padding: '40px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '2px 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center' }}>{isLoginMode ? 'Sign In to ComicSnap' : 'Create New Account'}</h2>
            
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>

                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                
                <button 
                    type="submit" 
                    style={{ width: '100%', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {isLoginMode ? 'Log In' : 'Sign Up'}
                </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '15px', cursor: 'pointer', color: '#007bff' }} onClick={toggleMode}>
                {isLoginMode ? "Need an account? Sign Up" : "Already have an account? Log In"}
            </p>
        </div>
    );
};

export default Login;