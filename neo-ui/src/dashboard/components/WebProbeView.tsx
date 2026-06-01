import React, { useState } from 'react';
import { Card, Badge, Button } from '@shared/components';
import { useProbes, ProbeConfig, type ExtractionResult, type SemanticAnalysis } from '@shared/hooks';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Semantic Analysis Panel ──────────────────────────────────────────────────

const RelevanceBadge: React.FC<{ label: SemanticAnalysis['relevance_label']; score: number }> = ({ label, score }) => {
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    High:   { bg: 'rgba(52,211,153,0.12)',  color: '#34d399', border: 'rgba(52,211,153,0.35)' },
    Medium: { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.35)' },
    Low:    { bg: 'rgba(148,163,184,0.1)',  color: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
  };
  const c = colors[label] ?? colors.Low;
  return (
    <span
      className="text-[8px] font-mono px-1.5 py-0.5 rounded"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      ⭐ {Math.round(score * 100)}% {label}
    </span>
  );
};

const SentimentBadge: React.FC<{ label: string; score: number }> = ({ label, score }) => {
  const icon = label === 'positive' ? '😊' : label === 'negative' ? '😟' : '😐';
  const color = label === 'positive' ? '#34d399' : label === 'negative' ? '#f87171' : '#94a3b8';
  return (
    <span className="text-[8px] font-mono" style={{ color }}>
      {icon} {label} ({score > 0 ? '+' : ''}{score.toFixed(2)})
    </span>
  );
};

const SemanticPanel: React.FC<{
  semantic: SemanticAnalysis;
  onReAnalyze?: () => void;
}> = ({ semantic, onReAnalyze }) => {
  if (semantic.analyzing) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mt-2 px-3 py-2 rounded-lg"
        style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-neo-accent animate-pulse">🧠 ANALYSE SÉMANTIQUE EN COURS...</span>
          <span className="text-[8px] font-mono text-neo-text-dim opacity-60">Filtre Cognitif LLM actif</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 p-3 rounded-lg"
      style={{ background: 'rgba(15,15,30,0.6)', border: '1px solid rgba(99,102,241,0.2)' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-mono text-neo-accent font-semibold">🧠 ANALYSE SÉMANTIQUE</span>
        <div className="flex items-center gap-1.5">
          {/* Method badge */}
          {semantic.method === 'nano' ? (
            <span className="text-[7px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
              ⚡ NANO FALLBACK
            </span>
          ) : (
            <span className="text-[7px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
              🤖 {semantic.model ?? 'OLLAMA'}
            </span>
          )}
          {/* Codex saved badge */}
          {semantic.codex_worthy && (
            <span className="text-[7px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: semantic.codex_saved ? 'rgba(52,211,153,0.12)' : 'rgba(99,102,241,0.1)', color: semantic.codex_saved ? '#34d399' : '#818cf8', border: `1px solid ${semantic.codex_saved ? 'rgba(52,211,153,0.3)' : 'rgba(99,102,241,0.3)'}` }}>
              📚 {semantic.codex_saved ? 'CODEX ✓' : 'CODEX PENDING'}
            </span>
          )}
          {/* Re-analyze button */}
          {onReAnalyze && (
            <button
              onClick={(e) => { e.stopPropagation(); onReAnalyze(); }}
              className="text-[7px] font-mono text-neo-text-dim hover:text-neo-accent transition-colors px-1 py-0.5 rounded border border-neo-border"
              title="Relancer l'analyse sémantique"
            >
              ↻
            </button>
          )}
        </div>
      </div>

      {/* Theme */}
      {semantic.theme && (
        <div className="mb-1.5">
          <span className="text-[8px] font-mono text-neo-text-dim">THÈME : </span>
          <span className="text-[9px] font-mono font-semibold text-neo-text">{semantic.theme}</span>
        </div>
      )}

      {/* Summary */}
      {semantic.summary && (
        <p className="text-[9px] font-mono text-neo-text leading-relaxed mb-2 opacity-90">
          📝 {semantic.summary}
        </p>
      )}

      {/* Scores row */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {semantic.relevance_label && (
          <RelevanceBadge label={semantic.relevance_label} score={semantic.relevance_score} />
        )}
        {semantic.sentiment?.label && (
          <SentimentBadge label={semantic.sentiment.label} score={semantic.sentiment.score} />
        )}
      </div>

      {/* Entities */}
      {semantic.entities?.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap mb-1.5">
          <span className="text-[8px] font-mono text-neo-text-dim mr-1">🔍</span>
          {semantic.entities.slice(0, 6).map((e) => (
            <span key={e} className="text-[7px] font-mono px-1 rounded"
              style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.15)' }}>
              {e}
            </span>
          ))}
        </div>
      )}

      {/* Themes / tags */}
      {semantic.themes?.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[8px] font-mono text-neo-text-dim mr-1">🏷️</span>
          {semantic.themes.slice(0, 5).map((t) => (
            <span key={t} className="text-[7px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Error */}
      {semantic.error && (
        <p className="text-[8px] font-mono text-neo-danger mt-1 opacity-70">⚠ {semantic.error.slice(0, 80)}</p>
      )}
    </motion.div>
  );
};

// ─── Main WebProbeView ─────────────────────────────────────────────────────────

export const WebProbeView: React.FC = () => {
  const { results, loading, isProbing, executeProbe, clearResults, reAnalyze } = useProbes();

  const [config, setConfig] = useState<ProbeConfig>({
    selectors: { 'heading': 'h1' },
    extract_text: true,   // needed for semantic analysis
    extract_links: false,
    extract_images: false,
  });

  const [selectorKey, setSelectorKey] = useState('heading');
  const [selectorValue, setSelectorValue] = useState('h1');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAddSelector = () => {
    if (selectorKey && selectorValue) {
      setConfig({
        ...config,
        selectors: { ...config.selectors, [selectorKey]: selectorValue },
      });
      setSelectorKey('');
      setSelectorValue('');
    }
  };

  const handleRemoveSelector = (key: string) => {
    const newSelectors = { ...config.selectors };
    delete newSelectors[key];
    setConfig({ ...config, selectors: newSelectors });
  };

  return (
    <Card variant="glass" padding="md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🕷️</span>
          <h3 className="text-sm font-mono text-neo-text-dim tracking-wider">WEB PROBES</h3>
          {/* Phase 6D badge */}
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
            + FILTRE COGNITIF
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isProbing ? 'warning' : 'default'} dot pulse={isProbing} size="sm">
            {isProbing ? 'SCANNING ACTIVE TAB' : `${results.length} SAVED`}
          </Badge>
          <Button variant="danger" size="sm" onClick={clearResults} disabled={results.length === 0}>
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 bg-neo-bg-alt/50 border border-neo-border rounded-neo p-4">
          <h4 className="text-xs font-mono text-neo-text-dim mb-3">PROBE CONFIGURATION</h4>

          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-2 text-xs text-neo-text cursor-pointer">
              <input
                type="checkbox"
                className="accent-neo-accent"
                checked={config.extract_links}
                onChange={(e) => setConfig({ ...config, extract_links: e.target.checked })}
              />
              Extract All Links
            </label>
            <label className="flex items-center gap-2 text-xs text-neo-text cursor-pointer">
              <input
                type="checkbox"
                className="accent-neo-accent"
                checked={config.extract_images}
                onChange={(e) => setConfig({ ...config, extract_images: e.target.checked })}
              />
              Extract Image Sources
            </label>
            <label className="flex items-center gap-2 text-xs text-neo-text cursor-pointer">
              <input
                type="checkbox"
                className="accent-neo-accent"
                checked={config.extract_text}
                onChange={(e) => setConfig({ ...config, extract_text: e.target.checked })}
              />
              Extract Body Text
              <span className="text-[8px] font-mono text-neo-accent opacity-70">(requis pour IA)</span>
            </label>
          </div>

          <div className="h-px bg-neo-border mb-3" />

          <h4 className="text-xs font-mono text-neo-text-dim mb-2">CSS SELECTORS</h4>
          <div className="space-y-2 mb-3">
            {Object.entries(config.selectors).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between bg-neo-bg p-1.5 rounded border border-neo-border text-[10px] font-mono">
                <span className="text-neo-text truncate">
                  {k}: <span className="text-neo-accent">{v as string}</span>
                </span>
                <button onClick={() => handleRemoveSelector(k)} className="text-neo-danger hover:text-red-400 px-1">
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <input
              type="text"
              placeholder="Key (e.g. title)"
              value={selectorKey}
              onChange={(e) => setSelectorKey(e.target.value)}
              className="bg-neo-bg border border-neo-border rounded px-2 py-1 text-xs text-neo-text focus:outline-none"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Selector (e.g. h1)"
                value={selectorValue}
                onChange={(e) => setSelectorValue(e.target.value)}
                className="flex-1 bg-neo-bg border border-neo-border rounded px-2 py-1 text-xs text-neo-text focus:outline-none"
              />
              <Button variant="outline" size="sm" onClick={handleAddSelector}>+</Button>
            </div>
          </div>

          <Button
            variant="primary"
            className="w-full"
            onClick={() => executeProbe(config)}
            disabled={isProbing}
          >
            {isProbing ? 'PROBING...' : 'RUN ON ACTIVE TAB'}
          </Button>

          {/* Semantic analysis info */}
          <div className="mt-3 p-2 rounded text-center"
            style={{ background: 'rgba(99,102,241,0.05)', border: '1px dashed rgba(99,102,241,0.2)' }}>
            <p className="text-[8px] font-mono text-neo-text-dim leading-relaxed">
              🧠 Chaque probe déclenche automatiquement l'analyse sémantique via SmolLM2. Les pages pertinentes sont sauvegardées dans le Codex.
            </p>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 overflow-hidden rounded-neo border border-neo-border bg-neo-bg/50 flex flex-col">
          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-neo-text-dim animate-pulse">
              LOADING HISTORY...
            </div>
          ) : results.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="text-4xl mb-3 opacity-30">🕸️</div>
              <p className="text-sm text-neo-text-dim mb-1">No extraction history</p>
              <p className="text-[10px] font-mono text-neo-text-dim opacity-60">
                Run a probe to start collecting and analysing web pages.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-neo-bg-alt border-b border-neo-border shadow-md z-10">
                  <tr>
                    <th className="px-4 py-2 font-mono text-neo-text-dim font-medium">Time</th>
                    <th className="px-4 py-2 font-mono text-neo-text-dim font-medium">Page</th>
                    <th className="px-4 py-2 font-mono text-neo-text-dim font-medium">Status</th>
                    <th className="px-4 py-2 font-mono text-neo-text-dim font-medium">IA</th>
                    <th className="px-4 py-2 font-mono text-neo-text-dim font-medium">Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neo-border/50">
                  <AnimatePresence>
                    {results.map((res: ExtractionResult) => (
                      <React.Fragment key={res.id}>
                        <motion.tr
                          initial={{ opacity: 0, backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
                          animate={{ opacity: 1, backgroundColor: 'transparent' }}
                          className="hover:bg-neo-bg-alt/30 transition-colors cursor-pointer"
                          onClick={() => setExpandedId(expandedId === res.id ? null : res.id)}
                        >
                          <td className="px-4 py-3 font-mono text-[10px] text-neo-text-dim whitespace-nowrap">
                            {new Date(res.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3 max-w-[180px] truncate text-neo-text" title={res.title || res.url}>
                            {res.title || res.url}
                          </td>
                          <td className="px-4 py-3">
                            <div title={res.error || ''}>
                              <Badge variant={res.success ? 'success' : 'danger'} size="sm">
                                {res.success ? 'OK' : 'ERR'}
                              </Badge>
                            </div>
                          </td>
                          {/* Semantic analysis status column */}
                          <td className="px-3 py-3">
                            {!res.semantic ? null : res.semantic.analyzing ? (
                              <span className="text-[8px] font-mono text-neo-accent animate-pulse">🧠...</span>
                            ) : res.semantic.method === 'nano' ? (
                              <span className="text-[8px] font-mono" style={{ color: '#fbbf24' }}>⚡NANO</span>
                            ) : res.semantic.codex_worthy ? (
                              <span className="text-[8px] font-mono" style={{ color: '#34d399' }}>📚✓</span>
                            ) : (
                              <span className="text-[8px] font-mono" style={{ color: '#818cf8' }}>🤖OK</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-neo-accent flex items-center justify-between">
                            <span>{res.success ? Object.keys(res.data).length : '-'} items</span>
                            <span className="text-[10px] text-neo-text-dim">
                              {expandedId === res.id ? '▲' : '▼'}
                            </span>
                          </td>
                        </motion.tr>

                        {/* Expanded detail row */}
                        {expandedId === res.id && res.success && (
                          <tr className="bg-neo-bg-alt/20">
                            <td colSpan={5} className="px-4 py-3 border-t border-neo-border/50">
                              {/* Semantic Analysis Panel — Phase 6D */}
                              {res.semantic && (
                                <SemanticPanel
                                  semantic={res.semantic}
                                  onReAnalyze={() => reAnalyze(res)}
                                />
                              )}
                              {/* Raw data */}
                              <div className="mt-2">
                                <p className="text-[8px] font-mono text-neo-text-dim mb-1 opacity-60">DONNÉES BRUTES</p>
                                <pre className="text-[9px] text-neo-text font-mono whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar p-2 bg-neo-bg/50 rounded border border-neo-border/50">
                                  {JSON.stringify(
                                    // Exclude _body_text from display (too long)
                                    Object.fromEntries(
                                      Object.entries(res.data).filter(([k]) => k !== '_body_text')
                                    ),
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
