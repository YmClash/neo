import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@shared/components';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, } from 'recharts';
// ─── Metrics Chart Component ──────────────────────────────────────────────────
// Recharts-based time series visualization for monitoring data.
// Placeholder data for Phase 1
const PLACEHOLDER_DATA = Array.from({ length: 24 }, (_, i) => ({
    time: `${String(i).padStart(2, '0')}:00`,
    focus: Math.floor(Math.random() * 60 + 20),
    tasks: Math.floor(Math.random() * 10),
    probes: Math.floor(Math.random() * 30 + 5),
}));
// Custom tooltip styling
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload)
        return null;
    return (_jsxs("div", { className: "neo-glass p-3 rounded-neo text-xs font-mono", children: [_jsx("p", { className: "text-neo-text-dim mb-1", children: label }), payload.map((entry) => (_jsxs("p", { style: { color: entry.color }, children: [entry.name, ": ", _jsx("span", { className: "font-bold", children: entry.value })] }, entry.name)))] }));
};
export const MetricsChart = () => {
    return (_jsxs(Card, { variant: "glass", padding: "lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-sm font-mono text-neo-text-dim tracking-wider", children: "24H ACTIVITY" }), _jsxs("div", { className: "flex items-center gap-4 text-[10px] font-mono", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-[#6366f1]" }), " Focus"] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-[#34d399]" }), " Tasks"] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-[#fbbf24]" }), " Probes"] })] })] }), _jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(AreaChart, { data: PLACEHOLDER_DATA, children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "gradFocus", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: "#6366f1", stopOpacity: 0.3 }), _jsx("stop", { offset: "100%", stopColor: "#6366f1", stopOpacity: 0 })] }), _jsxs("linearGradient", { id: "gradTasks", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: "#34d399", stopOpacity: 0.3 }), _jsx("stop", { offset: "100%", stopColor: "#34d399", stopOpacity: 0 })] }), _jsxs("linearGradient", { id: "gradProbes", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: "#fbbf24", stopOpacity: 0.3 }), _jsx("stop", { offset: "100%", stopColor: "#fbbf24", stopOpacity: 0 })] })] }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--neo-border)", opacity: 0.3 }), _jsx(XAxis, { dataKey: "time", stroke: "var(--neo-text-dim)", fontSize: 10, tickLine: false }), _jsx(YAxis, { stroke: "var(--neo-text-dim)", fontSize: 10, tickLine: false, axisLine: false }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}) }), _jsx(Area, { type: "monotone", dataKey: "focus", stroke: "#6366f1", fill: "url(#gradFocus)", strokeWidth: 2 }), _jsx(Area, { type: "monotone", dataKey: "tasks", stroke: "#34d399", fill: "url(#gradTasks)", strokeWidth: 2 }), _jsx(Area, { type: "monotone", dataKey: "probes", stroke: "#fbbf24", fill: "url(#gradProbes)", strokeWidth: 2 })] }) })] }));
};
//# sourceMappingURL=MetricsChart.js.map