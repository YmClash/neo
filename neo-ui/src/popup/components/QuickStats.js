import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { Card } from '@shared/components';
export const QuickStats = () => {
    // TODO: Replace with real data from service worker
    const stats = [
        { label: 'Focus', value: '—', icon: '⏱️', trend: 'stable' },
        { label: 'Tasks', value: '0', icon: '📋', trend: 'stable' },
        { label: 'Probes', value: '0', icon: '🕷️', trend: 'stable' },
    ];
    const trendIcon = (trend) => {
        switch (trend) {
            case 'up': return '↑';
            case 'down': return '↓';
            default: return '—';
        }
    };
    const trendColor = (trend) => {
        switch (trend) {
            case 'up': return 'text-neo-success';
            case 'down': return 'text-neo-danger';
            default: return 'text-neo-text-dim';
        }
    };
    return (_jsx("div", { className: "grid grid-cols-3 gap-2", children: stats.map((stat, i) => (_jsx(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { delay: i * 0.1 }, children: _jsxs(Card, { variant: "flat", padding: "sm", className: "text-center", children: [_jsx("div", { className: "text-lg mb-1", children: stat.icon }), _jsx("div", { className: "text-base font-bold font-mono text-neo-text", children: stat.value }), _jsxs("div", { className: "flex items-center justify-center gap-1 mt-0.5", children: [_jsx("span", { className: "text-[9px] font-mono text-neo-text-dim uppercase tracking-wider", children: stat.label }), stat.trend && (_jsx("span", { className: `text-[9px] ${trendColor(stat.trend)}`, children: trendIcon(stat.trend) }))] })] }) }, stat.label))) }));
};
//# sourceMappingURL=QuickStats.js.map