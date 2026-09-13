import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { hydrateStateCache } from './utils';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);

const bootstrap = async () => {
  await hydrateStateCache();
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

void bootstrap();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.warn('Service worker registration failed', error);
    });
  });
}
