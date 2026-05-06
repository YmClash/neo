import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, ThemeSwitcher } from '@shared/components';
import { useModules, useWasm } from '@shared/hooks';
import { ModuleToggle } from './components/ModuleToggle';
import { QuickStats } from './components/QuickStats';
import { StatusBar } from './components/StatusBar';
import { FocusTimerWidget } from '@shared/components';
// ─── Neo Popup ────────────────────────────────────────────────────────────────
// The control panel that opens when clicking the extension icon.
export const Popup = () => {
    const { modules, activeModules, toggleModule } = useModules();
    const { ready: wasmReady, loading: wasmLoading } = useWasm();
    // Apply stored theme on mount
    useEffect(() => {
        chrome.storage.local.get('neo_theme', (result) => {
            const theme = result.neo_theme || 'egghead';
            document.documentElement.setAttribute('data-theme', theme);
        });
    }, []);
    const openDashboard = () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('dist/src/dashboard/dashboard.html') });
    };
    return (_jsxs("div", { className: "min-h-[500px] bg-neo-bg flex flex-col", children: [_jsxs("header", { className: "relative px-4 pt-4 pb-3 border-b border-neo-border overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 neo-scanline opacity-20 pointer-events-none" }), _jsxs("div", { className: "relative flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(motion.div, { animate: { rotate: [0, 360] }, transition: { duration: 20, repeat: Infinity, ease: 'linear' }, className: "text-2xl", children: "\uD83E\uDDEC" }), _jsxs("div", { children: [_jsx("h1", { className: "text-lg font-display font-bold neo-gradient-text", children: "NEO" }), _jsx("p", { className: "text-[10px] font-mono text-neo-text-dim tracking-wider", children: "ADVANCED MONITORING v0.1.0" })] })] }), _jsx(ThemeSwitcher, { compact: true })] })] }), _jsx(StatusBar, { wasmReady: wasmReady, wasmLoading: wasmLoading, activeCount: activeModules.length, totalCount: modules.length }), _jsxs("div", { className: "px-4 py-3 space-y-3", children: [_jsx(QuickStats, {}), _jsx(FocusTimerWidget, { compact: true })] }), _jsxs("div", { className: "flex-1 px-4 pb-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-xs font-mono text-neo-text-dim tracking-wider", children: "MODULES" }), _jsxs(Badge, { variant: "accent", size: "sm", children: [activeModules.length, "/", modules.length] })] }), _jsx(AnimatePresence, { children: _jsx("div", { className: "space-y-2", children: modules.map((module, index) => (_jsx(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { delay: index * 0.05 }, children: _jsx(ModuleToggle, { module: module, onToggle: () => toggleModule(module.id) }) }, module.id))) }) })] }), _jsx("footer", { className: "px-4 py-3 border-t border-neo-border", children: _jsx(motion.button, { whileHover: { scale: 1.01 }, whileTap: { scale: 0.99 }, onClick: openDashboard, className: "w-full py-2.5 rounded-neo bg-neo-accent/10 text-neo-accent\n                     border border-neo-accent/20 hover:border-neo-accent/50\n                     font-mono text-xs tracking-wider\n                     transition-all duration-200\n                     hover:bg-neo-accent/20 hover:shadow-lg hover:shadow-neo-accent/10", children: "\u25C8 OPEN FULL DASHBOARD" }) })] }));
};
//# sourceMappingURL=Popup.js.map