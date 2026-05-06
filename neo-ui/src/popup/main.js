import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Popup } from './Popup';
// Import CSS through JS so Vite bundles it properly
import '@themes/base.css';
import '@themes/theme-egghead.css';
import '@themes/theme-matrix.css';
import '@themes/theme-punk.css';
const root = document.getElementById('neo-popup-root');
if (root) {
    ReactDOM.createRoot(root).render(_jsx(React.StrictMode, { children: _jsx(Popup, {}) }));
}
//# sourceMappingURL=main.js.map