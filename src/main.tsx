import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
// import App from './App.js';
import './styles.css';
import './shared/mobileNavigation.css';
import { RouterProvider } from 'react-router';
import router from './AppRoutes.js';

// This app does not ship a service worker. Clear registrations left by older local PWA builds
// so an outdated worker cannot replay or consume API responses in the dev browser.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
    if (!registrations.length) return;
    const wasControlled = Boolean(navigator.serviceWorker.controller);
    await Promise.all(registrations.map((registration) => registration.unregister()));
    if (wasControlled) window.location.reload();
  }).catch((error: unknown) => console.warn('Could not clear an older local service worker.', error));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
