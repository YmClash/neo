import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useCallback, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@shared/components';
import { useSystemMetrics } from '@shared/hooks';
const TWO_PI = Math.PI * 2;
function lerp(a, b, t) {
    return a + (b - a) * Math.max(0, Math.min(1, t));
}
function cpuToColor(cpu, isPanic) {
    if (isPanic)
        return '#ff2200';
    if (cpu < 30)
        return '#34d399';
    if (cpu < 60)
        return '#fbbf24';
    if (cpu < 80)
        return '#f97316';
    return '#ef4444';
}
function describeArc(cx, cy, r, pct) {
    const angle = (pct / 100) * TWO_PI - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return `M ${cx} ${cy - r} A ${r} ${r} 0 ${pct > 50 ? 1 : 0} 1 ${x} ${y}`;
}
// ─── Animated Canvas Wave ─────────────────────────────────────────────────────
const OscilloscopeCanvas = ({ cpu, ram, isPanic, isAIThinking }) => {
    const canvasRef = useRef(null);
    const phaseRef = useRef(0);
    const rafRef = useRef(0);
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        const W = canvas.width, H = canvas.height, cx = H / 2;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            ctx.beginPath();
            ctx.moveTo(0, (H / 4) * i);
            ctx.lineTo(W, (H / 4) * i);
            ctx.stroke();
        }
        // AI Thinking = magenta + max amplitude + fast frequency
        const amplitude = isAIThinking ? cx * 0.9 : lerp(6, cx * 0.85, cpu / 100);
        const frequency = isAIThinking ? 5.5 : lerp(1.5, 4.5, ram / 100);
        const color = isAIThinking ? '#c084fc' : cpuToColor(cpu, isPanic);
        phaseRef.current += isAIThinking ? 0.12 : frequency * 0.04;
        const gradient = ctx.createLinearGradient(0, cx - amplitude, 0, cx + amplitude);
        gradient.addColorStop(0, color + '33');
        gradient.addColorStop(1, 'transparent');
        const pts = [];
        for (let i = 0; i < W; i++) {
            const t = (i / W) * TWO_PI * frequency + phaseRef.current;
            const y = cx
                + Math.sin(t) * amplitude
                + Math.sin(t * 2.1 + 0.5) * (amplitude * 0.25)
                + Math.sin(t * 0.5 - 0.3) * (amplitude * 0.15);
            pts.push([i, y]);
        }
        ctx.beginPath();
        pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
        ctx.lineTo(W, cx);
        ctx.lineTo(0, cx);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.beginPath();
        pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
        ctx.strokeStyle = color;
        ctx.lineWidth = (isPanic || isAIThinking) ? 2.5 : 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = (isPanic || isAIThinking) ? 20 : 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
        rafRef.current = requestAnimationFrame(draw);
    }, [cpu, ram, isPanic, isAIThinking]);
    useEffect(() => {
        rafRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(rafRef.current);
    }, [draw]);
    return _jsx("canvas", { ref: canvasRef, width: 600, height: 100, style: { width: '100%', height: '100px', display: 'block' } });
};
// ─── Circular Gauge ───────────────────────────────────────────────────────────
const CircularGauge = ({ value, label, color, sublabel }) => {
    const r = 38, cx = 50, cy = 50;
    return (_jsxs("div", { className: "flex flex-col items-center gap-1", children: [_jsxs("svg", { width: "100", height: "100", viewBox: "0 0 100 100", children: [_jsx("path", { d: describeArc(cx, cy, r, 99.9), fill: "none", stroke: "rgba(255,255,255,0.08)", strokeWidth: "6", strokeLinecap: "round" }), value > 0 && _jsx("path", { d: describeArc(cx, cy, r, value), fill: "none", stroke: color, strokeWidth: "6", strokeLinecap: "round", style: { filter: `drop-shadow(0 0 6px ${color})` } }), _jsx("text", { x: "50", y: "46", textAnchor: "middle", fill: "white", fontSize: "16", fontWeight: "700", fontFamily: "JetBrains Mono, monospace", children: Math.round(value) }), _jsx("text", { x: "50", y: "60", textAnchor: "middle", fill: "rgba(255,255,255,0.5)", fontSize: "9", fontFamily: "JetBrains Mono, monospace", children: "%" })] }), _jsx("span", { className: "text-[10px] font-mono tracking-widest", style: { color }, children: label }), sublabel && _jsx("span", { className: "text-[9px] font-mono text-neo-text-dim", children: sublabel })] }));
};
const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload)
        return null;
    return (_jsx("div", { className: "neo-glass p-2 rounded text-[10px] font-mono", children: payload.map((e) => _jsxs("p", { style: { color: e.color }, children: [e.name, ": ", _jsxs("b", { children: [e.value.toFixed(1), "%"] })] }, e.name)) }));
};
const BridgeOffline = () => (_jsxs("div", { className: "flex flex-col items-center justify-center h-48 gap-3 text-center", children: [_jsx("div", { className: "text-4xl animate-pulse", children: "\uD83D\uDD0C" }), _jsx("p", { className: "text-sm font-mono text-neo-text-dim", children: "BRIDGE HORS LIGNE" }), _jsxs("p", { className: "text-[10px] font-mono text-neo-text-dim max-w-xs", children: ["Lance ", _jsx("code", { className: "text-neo-accent", children: "install-host.ps1" }), " pour activer le Native Messaging Host"] }), _jsx("div", { className: "flex gap-1 mt-2", children: [0, 1, 2].map((i) => (_jsx("div", { className: "w-2 h-2 rounded-full bg-neo-accent", style: { opacity: 0.4, animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite` } }, i))) })] }));
// ─── Main Component ───────────────────────────────────────────────────────────
export const BrainOscilloscope = () => {
    const { current, history, isConnected, isPanic, panicLevel, panicReason, lastUpdate } = useSystemMetrics();
    const [isAIThinking, setAIThinking] = useState(false);
    // Thinking Heartbeat — listens to neo_ai_thinking from chrome.storage
    useEffect(() => {
        chrome.storage.local.get('neo_ai_thinking', (r) => setAIThinking(r.neo_ai_thinking ?? false));
        const listener = (changes) => {
            if (changes.neo_ai_thinking !== undefined)
                setAIThinking(changes.neo_ai_thinking.newValue ?? false);
        };
        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }, []);
    const cpu = current?.cpu_percent ?? 0;
    const ram = current?.memory_percent ?? 0;
    const disk = current?.disk_percent ?? 0;
    const chartData = history.slice(-30).map((p, i) => ({ t: i, cpu: p.cpu, ram: p.ram }));
    const cpuColor = isAIThinking ? '#c084fc' : cpuToColor(cpu, isPanic);
    const diskColor = disk > 80 ? '#f97316' : '#34d399';
    const lastStr = lastUpdate ? new Date(lastUpdate).toLocaleTimeString('fr-FR') : '--:--:--';
    return (_jsxs(Card, { variant: "glass", padding: "lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "text-xs font-mono text-neo-text-dim tracking-wider", children: "\uD83E\uDDE0 CERVEAU OSCILLOSCOPE" }), isAIThinking && (_jsx("span", { className: "text-[10px] font-mono px-2 py-0.5 rounded-full animate-pulse", style: { background: 'rgba(192,132,252,0.15)', color: '#c084fc', border: '1px solid #c084fc' }, children: "\uD83E\uDD16 CALCUL IA" })), isPanic && !isAIThinking && (_jsxs("span", { className: "text-[10px] font-mono px-2 py-0.5 rounded-full animate-pulse", style: { background: 'rgba(255,34,0,0.2)', color: '#ff2200', border: '1px solid #ff2200' }, children: ["\u26A0 ", panicLevel] }))] }), _jsxs("div", { className: "flex items-center gap-2 text-[10px] font-mono", children: [_jsx("span", { className: "text-neo-text-dim", children: lastStr }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "w-2 h-2 rounded-full", style: {
                                            background: isConnected ? '#34d399' : '#ef4444',
                                            boxShadow: isConnected ? '0 0 6px #34d399' : '0 0 6px #ef4444',
                                        } }), isConnected ? 'BRIDGE ONLINE' : 'OFFLINE'] })] })] }), isPanic && panicReason && (_jsxs("div", { className: "mb-3 px-3 py-2 rounded text-[10px] font-mono text-center", style: { background: 'rgba(255,34,0,0.1)', border: '1px solid rgba(255,34,0,0.3)', color: '#ff6644' }, children: ["\uD83D\uDD34 ", panicReason] })), isAIThinking && (_jsx("div", { className: "mb-3 px-3 py-2 rounded text-[10px] font-mono text-center", style: { background: 'rgba(192,132,252,0.08)', border: '1px solid rgba(192,132,252,0.25)', color: '#c084fc' }, children: "\uD83E\uDD16 Analyse en cours \u2014 S\u00E9quence de donn\u00E9es synchronis\u00E9e..." })), !isConnected ? (_jsx(BridgeOffline, {})) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "mb-4 rounded-lg overflow-hidden", style: { background: 'rgba(0,0,0,0.4)', border: `1px solid ${isAIThinking ? 'rgba(192,132,252,0.3)' : 'var(--neo-border)'}` }, children: _jsx(OscilloscopeCanvas, { cpu: cpu, ram: ram, isPanic: isPanic, isAIThinking: isAIThinking }) }), _jsxs("div", { className: "flex justify-around mb-4", children: [_jsx(CircularGauge, { value: cpu, label: "CPU", color: cpuColor, sublabel: current?.top_processes?.[0]?.name ?? '—' }), _jsx(CircularGauge, { value: ram, label: "RAM", color: "#818cf8", sublabel: `${current?.memory_used_mb?.toFixed(0) ?? 0}/${current?.memory_total_mb?.toFixed(0) ?? 0}MB` }), _jsx(CircularGauge, { value: disk, label: "DISK", color: diskColor, sublabel: `${current?.disk_used_gb?.toFixed(1) ?? 0}/${current?.disk_total_gb?.toFixed(1) ?? 0}GB` })] }), chartData.length > 1 && (_jsxs("div", { className: "mb-3", children: [_jsx("p", { className: "text-[9px] font-mono text-neo-text-dim mb-1 tracking-widest", children: "HISTORIQUE \u2014 90s" }), _jsx(ResponsiveContainer, { width: "100%", height: 60, children: _jsxs(AreaChart, { data: chartData, children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "gC", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: cpuColor, stopOpacity: 0.35 }), _jsx("stop", { offset: "100%", stopColor: cpuColor, stopOpacity: 0 })] }), _jsxs("linearGradient", { id: "gR", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: "#818cf8", stopOpacity: 0.25 }), _jsx("stop", { offset: "100%", stopColor: "#818cf8", stopOpacity: 0 })] })] }), _jsx(CartesianGrid, { stroke: "rgba(255,255,255,0.04)", strokeDasharray: "3 3" }), _jsx(YAxis, { domain: [0, 100], hide: true }), _jsx(XAxis, { dataKey: "t", hide: true }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}) }), _jsx(Area, { type: "monotone", dataKey: "cpu", name: "CPU", stroke: cpuColor, fill: "url(#gC)", strokeWidth: 1.5, dot: false }), _jsx(Area, { type: "monotone", dataKey: "ram", name: "RAM", stroke: "#818cf8", fill: "url(#gR)", strokeWidth: 1.5, dot: false })] }) })] })), _jsxs("div", { className: "grid grid-cols-3 gap-2 text-[9px] font-mono", children: [_jsxs("div", { className: "rounded px-2 py-1", style: { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--neo-border)' }, children: [_jsx("div", { className: "text-neo-text-dim", children: "\u2191 SENT" }), _jsxs("div", { className: "text-neo-accent font-bold", children: [current?.network_sent_mb?.toFixed(1) ?? 0, " MB"] })] }), _jsxs("div", { className: "rounded px-2 py-1", style: { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--neo-border)' }, children: [_jsx("div", { className: "text-neo-text-dim", children: "\u2193 RECV" }), _jsxs("div", { className: "text-neo-accent font-bold", children: [current?.network_recv_mb?.toFixed(1) ?? 0, " MB"] })] }), _jsxs("div", { className: "rounded px-2 py-1", style: { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--neo-border)' }, children: [_jsx("div", { className: "text-neo-text-dim", children: "LATENCE" }), _jsxs("div", { className: "text-neo-success font-bold", children: [current?.latency_ms ?? '—', " ms"] })] })] }), (current?.top_processes ?? []).length > 0 && (_jsxs("div", { className: "mt-3", children: [_jsx("p", { className: "text-[9px] font-mono text-neo-text-dim mb-1 tracking-widest", children: "TOP PROCESSUS" }), _jsx("div", { className: "space-y-1", children: (current?.top_processes ?? []).slice(0, 3).map((p) => (_jsxs("div", { className: "flex items-center gap-2 text-[9px] font-mono", children: [_jsx("span", { className: "text-neo-text-dim truncate flex-1", children: p.name }), _jsx("div", { className: "w-14 h-1 rounded-full overflow-hidden bg-white/10", children: _jsx("div", { className: "h-full rounded-full", style: { width: `${Math.min(p.cpu_percent, 100)}%`, background: cpuToColor(p.cpu_percent, false) } }) }), _jsxs("span", { style: { color: cpuToColor(p.cpu_percent, false) }, children: [p.cpu_percent.toFixed(1), "%"] })] }, p.pid))) })] }))] }))] }));
};
//# sourceMappingURL=BrainOscilloscope.js.map