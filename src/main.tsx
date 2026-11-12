import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n';
import './index.css';
import { applyStoredTheme } from './lib/theme';
import App from './App';

applyStoredTheme();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
