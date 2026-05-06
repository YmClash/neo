import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge, ThemeSwitcher, FocusTimerWidget } from '@shared/components';
import { useModules, useWasm } from '@shared/hooks';
import { MetricsChart } from './components/MetricsChart';
import { ModulePanel } from './components/ModulePanel';
import { TaskBoard } from './components/TaskBoard';
import { WebProbeView } from './components/WebProbeView';
// ─── Neo Dashboard ────────────────────────────────────────────────────────────
// Full-screen monitoring and control interface.
export const Dashboard = () => {
    const { modules, activeModules, toggleModule } = useModules();
    const { ready: wasmReady, wasm } = useWasm();
    // Apply stored theme on mount
    useEffect(() => {
        chrome.storage.local.get('neo_theme', (result) => {
            const theme = result.neo_theme || 'egghead';
            document.documentElement.setAttribute('data-theme', theme);
        });
    }, []);
    return (_jsxs("div", { className: "min-h-screen bg-neo-bg neo-grid-bg", children: [_jsx("nav", { className: "sticky top-0 z-50 neo-glass border-b border-neo-border px-6 py-3", children: _jsxs("div", { className: "max-w-7xl mx-auto flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(motion.div, { animate: { rotate: [0, 360] }, transition: { duration: 20, repeat: Infinity, ease: 'linear' }, className: "text-3xl", children: "\uD83E\uDDEC" }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-display font-bold neo-gradient-text", children: "NEO DASHBOARD" }), _jsx("p", { className: "text-xs font-mono text-neo-text-dim tracking-widest", children: "ADVANCED MONITORING & CONTROL SYSTEM" })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Badge, { variant: wasmReady ? 'success' : 'warning', dot: true, pulse: !wasmReady, children: ["WASM ", wasmReady ? 'ONLINE' : 'LOADING'] }), _jsxs(Badge, { variant: "info", dot: true, children: [activeModules.length, " MODULES"] }), wasm && (_jsxs(Badge, { variant: "accent", size: "sm", children: ["CORE v", wasm.version()] }))] }), _jsx(ThemeSwitcher, {})] })] }) }), _jsxs("main", { className: "max-w-7xl mx-auto px-6 py-6", children: [_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6", children: [_jsxs("section", { className: "lg:col-span-2", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("span", { className: "text-xs font-mono text-neo-text-dim tracking-widest", children: "\u25C8 METRICS OVERVIEW" }), _jsx("div", { className: "flex-1 h-px bg-neo-border" })] }), _jsx(MetricsChart, {})] }), _jsxs("section", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("span", { className: "text-xs font-mono text-neo-text-dim tracking-widest", children: "\u25C8 FOCUS TIMER" }), _jsx("div", { className: "flex-1 h-px bg-neo-border" })] }), _jsx(FocusTimerWidget, {})] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6", children: [_jsxs("section", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("span", { className: "text-xs font-mono text-neo-text-dim tracking-widest", children: "\u25C8 MODULE CONTROL" }), _jsx("div", { className: "flex-1 h-px bg-neo-border" })] }), _jsx(ModulePanel, { modules: modules, onToggle: toggleModule })] }), _jsxs("section", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("span", { className: "text-xs font-mono text-neo-text-dim tracking-widest", children: "\u25C8 TASK BOARD" }), _jsx("div", { className: "flex-1 h-px bg-neo-border" })] }), _jsx(TaskBoard, {})] })] }), _jsxs("section", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("span", { className: "text-xs font-mono text-neo-text-dim tracking-widest", children: "\u25C8 WEB PROBES" }), _jsx("div", { className: "flex-1 h-px bg-neo-border" })] }), _jsx(WebProbeView, {})] })] }), _jsx("footer", { className: "border-t border-neo-border py-4 mt-8", children: _jsxs("div", { className: "max-w-7xl mx-auto px-6 flex items-center justify-between", children: [_jsx("span", { className: "text-[10px] font-mono text-neo-text-dim", children: "NEO v0.1.0 \u2014 EGGHEAD LABORATORY" }), _jsx("span", { className: "text-[10px] font-mono text-neo-text-dim", children: new Date().toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            }) })] }) })] }));
};
//# sourceMappingURL=Dashboard.js.map