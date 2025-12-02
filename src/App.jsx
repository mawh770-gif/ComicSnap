// src/App.jsx
// Forcing redeploy V12-02-25 17:12
import React from 'react';
import { useAuth } from './context/AuthContext';
import Scanner from './components/Scanner'; 
import Login from './components/Login'; // Assuming you have a Login component

const App = () => {
  // Use the context to get the current authentication state and status
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading authentication status...</div>;
  }

  // If currentUser exists, render the Scanner interface.
  if (currentUser) {
    return <Scanner />;
  }

  // Otherwise, render the Login interface.
  return <Login />;
};

export default App;