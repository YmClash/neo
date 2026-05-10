import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@shared/components';
import { useContextBuffer } from '@shared/hooks';
// ─── Context Journal Component ────────────────────────────────────────────────
// Displays the Phase-4-ready AI context buffer as a chronological timeline.
// Every user action is logged here and will serve as context for Ollama AI.
const SENTIMENT_COLORS = {
    positive: '#34d399',
    negative: '#f87171',
    neutral: '#8892b0',
};
function formatTs(ts) {
    return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function formatAge(ts) {
    const secs = Math.floor((Date.now() - ts) / 1000);
    if (secs < 60)
        return `${secs}s`;
    if (secs < 3600)
        return `${Math.floor(secs / 60)}m`;
    return `${Math.floor(secs / 3600)}h`;
}
// ─── Event Detail Renderers ───────────────────────────────────────────────────
function renderDetail(type, data) {
    switch (type) {
        case 'focus_started': return `${data.minutes}min démarré`;
        case 'focus_session_completed': return `Session ${data.duration_minutes}min terminée`;
        case 'task_completed': return `"${data.text}" (${data.quadrant})`;
        case 'probe_executed': {
            const url = String(data.url ?? '').replace(/^https?:\/\//, '').slice(0, 40);
            const s = data.sentiment;
            const sentiment = s?.label ? ` · ${s.label} (${s.score?.toFixed(2)})` : '';
            return `${url}${sentiment} · ${data.items} items`;
        }
        case 'command_executed': return `$ ${data.cmd}`;
        case 'panic_triggered': return `CPU ${data.cpu}% / RAM ${data.ram}% — ${data.level}`;
        case 'panic_recovered': return `CPU ${data.cpu}% / RAM ${data.ram}% — stabilisé`;
        default: return JSON.stringify(data).slice(0, 60);
    }
}
// ─── Main Component ───────────────────────────────────────────────────────────
export const ContextJournal = () => {
    const { events, totalCount, clear, getIcon, getLabel } = useContextBuffer();
    const usedPct = Math.round((totalCount / 50) * 100);
    return (_jsxs(Card, { variant: "glass", padding: "lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "text-xs font-mono text-neo-text-dim tracking-wider", children: "\uD83E\uDDE0 CONTEXT JOURNAL" }), _jsx("span", { className: "text-[9px] font-mono px-1.5 py-0.5 rounded", style: { background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }, children: "PHASE 4 READY" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-[9px] font-mono text-neo-text-dim", children: [totalCount, "/50"] }), _jsx("button", { onClick: clear, className: "text-[9px] font-mono text-neo-text-dim hover:text-neo-danger transition-colors px-2 py-0.5 rounded border border-neo-border", children: "CLEAR" })] })] }), _jsxs("div", { className: "mb-3", children: [_jsx("div", { className: "h-1 rounded-full overflow-hidden", style: { background: 'rgba(255,255,255,0.06)' }, children: _jsx("div", { className: "h-full rounded-full transition-all duration-500", style: {
                                width: `${usedPct}%`,
                                background: usedPct > 80
                                    ? 'linear-gradient(90deg, #f97316, #ef4444)'
                                    : 'linear-gradient(90deg, #6366f1, #34d399)',
                            } }) }), _jsx("p", { className: "text-[8px] font-mono text-neo-text-dim mt-1", children: "Tampon de contexte \u2014 sera transmis \u00E0 l'IA Ollama (Phase 4)" })] }), events.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-24 text-center gap-2", children: [_jsx("span", { className: "text-2xl opacity-30", children: "\uD83D\uDCED" }), _jsx("p", { className: "text-[10px] font-mono text-neo-text-dim", children: "Aucun \u00E9v\u00E9nement enregistr\u00E9" }), _jsx("p", { className: "text-[9px] font-mono text-neo-text-dim", children: "Utilise les modules pour remplir le buffer" })] })) : (_jsx("div", { className: "space-y-1 overflow-y-auto", style: { maxHeight: '220px', scrollbarWidth: 'thin' }, children: _jsx(AnimatePresence, { initial: false, children: events.slice(0, 20).map((event) => (_jsxs(motion.div, { initial: { opacity: 0, x: -8 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0 }, transition: { duration: 0.2 }, className: "flex items-start gap-2 rounded px-2 py-1.5 text-[9px] font-mono", style: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }, children: [_jsx("span", { className: "text-base leading-none shrink-0", children: getIcon(event.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-0.5", children: [_jsx("span", { className: "text-neo-accent font-bold tracking-wide", children: getLabel(event.type) }), event.type === 'probe_executed' && event.data.sentiment != null && (() => {
                                                const s = event.data.sentiment;
                                                const label = s?.label ?? 'neutral';
                                                return (_jsx("span", { style: { color: SENTIMENT_COLORS[label] ?? '#8892b0' }, children: label }));
                                            })()] }), _jsx("span", { className: "text-neo-text-dim truncate block", children: renderDetail(event.type, event.data) })] }), _jsxs("div", { className: "text-right shrink-0", children: [_jsx("div", { className: "text-neo-text-dim", children: formatTs(event.ts) }), _jsx("div", { style: { color: 'rgba(136,146,176,0.6)' }, children: formatAge(event.ts) })] })] }, `${event.ts}-${event.type}`))) }) }))] }));
};
//# sourceMappingURL=ContextJournal.js.map