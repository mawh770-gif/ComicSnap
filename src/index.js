// src/index.js (Mandatory Edit)

import React from 'react';
import ReactDOM from 'react-dom/client'; // Use ReactDOM.createRoot for modern React
import App from './App';
// 👇 NEW IMPORT: Import the provider component
import { AuthProvider } from './context/AuthContext'; 

// Assuming you have a standard root element defined in public/index.html
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {/* 👇 CRITICAL STEP: Wrap the App component with the AuthProvider */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// If you are using the older React 17 method, the render logic would be:
/*
import ReactDOM from 'react-dom';
...
ReactDOM.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
*/