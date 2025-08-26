// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './style/index.css';
import { AuthProvider } from './context/authContext';
import { AtlitProvider } from './context/AtlitContext';
import { RegistrationProvider } from './context/registrationContext';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
        <RegistrationProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        </RegistrationProvider>
    </AuthProvider>
  </React.StrictMode>
);
