import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@shared/components';
import { useContextBuffer } from '@shared/hooks';

// ─── Context Journal Component ────────────────────────────────────────────────
// Displays the Phase-4-ready AI context buffer as a chronological timeline.
// Every user action is logged here and will serve as context for Ollama AI.

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#34d399',
  negative: '#f87171',
  neutral:  '#8892b0',
};

function formatTs(ts: number): string {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatAge(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60)  return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  return `${Math.floor(secs / 3600)}h`;
}

// ─── Event Detail Renderers ───────────────────────────────────────────────────

function renderDetail(type: string, data: Record<string, unknown>): string {
  switch (type) {
    case 'focus_started':           return `${data.minutes}min démarré`;
    case 'focus_session_completed': return `Session ${data.duration_minutes}min terminée`;
    case 'task_completed':          return `"${data.text}" (${data.quadrant})`;
    case 'probe_executed': {
      const url = String(data.url ?? '').replace(/^https?:\/\//, '').slice(0, 40);
      const s = data.sentiment as { label?: string; score?: number } | undefined;
      const sentiment = s?.label ? ` · ${s.label} (${s.score?.toFixed(2)})` : '';
      return `${url}${sentiment} · ${data.items} items`;
    }
    case 'command_executed': return `$ ${data.cmd}`;
    case 'panic_triggered':  return `CPU ${data.cpu}% / RAM ${data.ram}% — ${data.level}`;
    case 'panic_recovered':  return `CPU ${data.cpu}% / RAM ${data.ram}% — stabilisé`;
    default: return JSON.stringify(data).slice(0, 60);
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const ContextJournal: React.FC = () => {
  const { events, totalCount, clear, getIcon, getLabel } = useContextBuffer();

  const usedPct = Math.round((totalCount / 50) * 100);

  return (
    <Card variant="glass" padding="lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-mono text-neo-text-dim tracking-wider">🧠 CONTEXT JOURNAL</h3>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
            PHASE 4 READY
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-neo-text-dim">{totalCount}/50</span>
          <button
            onClick={clear}
            className="text-[9px] font-mono text-neo-text-dim hover:text-neo-danger transition-colors px-2 py-0.5 rounded border border-neo-border"
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* Buffer fill indicator */}
      <div className="mb-3">
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${usedPct}%`,
              background: usedPct > 80
                ? 'linear-gradient(90deg, #f97316, #ef4444)'
                : 'linear-gradient(90deg, #6366f1, #34d399)',
            }}
          />
        </div>
        <p className="text-[8px] font-mono text-neo-text-dim mt-1">
          Tampon de contexte — sera transmis à l'IA Ollama (Phase 4)
        </p>
      </div>

      {/* Event List */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-24 text-center gap-2">
          <span className="text-2xl opacity-30">📭</span>
          <p className="text-[10px] font-mono text-neo-text-dim">Aucun événement enregistré</p>
          <p className="text-[9px] font-mono text-neo-text-dim">Utilise les modules pour remplir le buffer</p>
        </div>
      ) : (
        <div className="space-y-1 overflow-y-auto" style={{ maxHeight: '220px', scrollbarWidth: 'thin' }}>
          <AnimatePresence initial={false}>
            {events.slice(0, 20).map((event) => (
              <motion.div
                key={`${event.ts}-${event.type}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2 rounded px-2 py-1.5 text-[9px] font-mono"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                {/* Icon */}
                <span className="text-base leading-none shrink-0">{getIcon(event.type)}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-neo-accent font-bold tracking-wide">{getLabel(event.type)}</span>
                    {event.type === 'probe_executed' && event.data.sentiment != null && (() => {
                      const s = event.data.sentiment as { label?: string };
                      const label = s?.label ?? 'neutral';
                      return (
                        <span style={{ color: SENTIMENT_COLORS[label] ?? '#8892b0' }}>
                          {label}
                        </span>
                      );
                    })()}
                  </div>
                  <span className="text-neo-text-dim truncate block">{renderDetail(event.type, event.data)}</span>
                </div>

                {/* Timestamp */}
                <div className="text-right shrink-0">
                  <div className="text-neo-text-dim">{formatTs(event.ts)}</div>
                  <div style={{ color: 'rgba(136,146,176,0.6)' }}>{formatAge(event.ts)}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
};
