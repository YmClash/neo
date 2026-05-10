import React from 'react';
import ReactDOM from 'react-dom/client';
import { Dashboard } from './Dashboard';

// Import CSS through JS so Vite bundles it properly
import '@themes/base.css';
import '@themes/theme-egghead.css';
import '@themes/theme-matrix.css';
import '@themes/theme-punk.css';
import '@themes/theme-punk-hazard.css';

const root = document.getElementById('neo-dashboard-root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Dashboard />
    </React.StrictMode>
  );
}
