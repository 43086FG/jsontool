import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n';
import { applyInstallerLanguage } from './i18n';
import './index.css';
import { applyStoredTheme } from './lib/theme';
import App from './App';

async function bootstrap() {
  applyStoredTheme();
  // First-run default from the installer; a manual choice in Settings always wins.
  await applyInstallerLanguage();

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();
