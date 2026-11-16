import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n';
import { applyInstallerLanguage, hasSavedLanguage } from './i18n';
import './index.css';
import { applyStoredTheme } from './lib/theme';
import App from './App';
import { FirstRunLanguage } from './components/FirstRunLanguage';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

function renderApp() {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

async function bootstrap() {
  applyStoredTheme();
  // Non-MSIX installers can still seed the first-run language; MSIX returns null.
  await applyInstallerLanguage();

  if (hasSavedLanguage()) {
    renderApp();
    return;
  }

  // No saved choice: ask before mounting the app so no screen flashes first.
  root.render(
    <React.StrictMode>
      <FirstRunLanguage onDone={renderApp} />
    </React.StrictMode>,
  );
}

void bootstrap();
