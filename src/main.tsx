import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

import { AccessibilityProvider } from '@/context/AccessibilityContext';
import { AuthProvider } from '@/context/AuthContext';
import { DocumentProvider } from '@/context/DocumentContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AccessibilityProvider>
        <AuthProvider>
          <DocumentProvider>
            <App />
          </DocumentProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </BrowserRouter>
  </React.StrictMode>
);
