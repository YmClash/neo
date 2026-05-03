import React from 'react';
import ReactDOM from 'react-dom/client';
import { Popup } from './Popup';

const root = document.getElementById('neo-popup-root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}
