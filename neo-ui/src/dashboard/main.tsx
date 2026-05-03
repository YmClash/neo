import React from 'react';
import ReactDOM from 'react-dom/client';
import { Dashboard } from './Dashboard';

const root = document.getElementById('neo-dashboard-root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Dashboard />
    </React.StrictMode>
  );
}
