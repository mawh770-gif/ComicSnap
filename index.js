import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// NOTE: For local setup, you will need to apply global Tailwind CSS styles 
// either via a CSS file or by including the CDN link in index.html.

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);