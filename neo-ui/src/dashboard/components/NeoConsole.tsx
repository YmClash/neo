import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@shared/components';
import {
  useNeoAI, NEO_SUGGESTIONS, PROVIDERS,
  type AIMessage, type AIProvider, type OllamaModel,
} from '@shared/hooks';

// ─── Provider Tab Bar ─────────────────────────────────────────────────────────

const ProviderBar: React.FC<{
  current: AIProvider;
  onChange: (p: AIProvider) => void;
  disabled: boolean;
}> = ({ current, onChange, disabled }) => (
  <div className="flex gap-1">
    {PROVIDERS.map((p) => (
      <button
        key={p.id}
        onClick={() => !disabled && onChange(p.id)}
        title={p.label}
        className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded transition-all"
        style={{
          background: current === p.id ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.06)',
          border: `1px solid ${current === p.id ? 'rgba(99,102,241,0.6)' : 'rgba(99,102,241,0.15)'}`,
          color: current === p.id ? '#818cf8' : '#8892b0',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {p.icon} {p.id === 'ollama' ? 'Local' : p.label.split(' ')[1]}
      </button>
    ))}
  </div>
);

// ─── Model Selector ───────────────────────────────────────────────────────────

const ModelSelector: React.FC<{
  current: string;
  provider: AIProvider;
  ollamaModels: OllamaModel[];
  onChange: (m: string) => void;
  disabled: boolean;
}> = ({ current, provider, ollamaModels, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = PROVIDERS.find((p) => p.id === provider)!;

  const modelList = provider === 'ollama'
    ? ollamaModels.map((m) => ({ id: m.name, label: `${m.name.split(':')[0]} (${m.params})` }))
    : cfg.models;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const displayName = current.split(':')[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded transition-all"
        style={{
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
          color: '#8892b0',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span>{displayName}</span><span style={{ opacity: 0.6 }}>▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute right-0 top-full mt-1 z-50 rounded-lg overflow-hidden"
            style={{ minWidth: '200px', background: 'rgba(14,20,40,0.97)', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          >
            {modelList.length === 0
              ? <div className="px-3 py-2 text-[9px] font-mono text-neo-text-dim">Aucun modèle détecté</div>
              : modelList.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { onChange(m.id); setOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-[9px] font-mono transition-colors"
                  style={{
                    background: m.id === current ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: m.id === current ? '#818cf8' : '#8892b0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  {m.label}
                </button>
              ))
            }
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── API Key Panel ────────────────────────────────────────────────────────────

const ApiKeyPanel: React.FC<{
  provider: AIProvider;
  apiKeys: Record<string, string>;
  onSave: (p: AIProvider, key: string) => void;
  onClose: () => void;
}> = ({ provider, apiKeys, onSave, onClose }) => {
  const cfg = PROVIDERS.find((p) => p.id === provider)!;
  const [val, setVal]     = useState(apiKeys[provider] ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!val.trim()) return;
    onSave(provider, val);
    setSaved(true);
    // Give storage 600ms to propagate before closing
    setTimeout(() => onClose(), 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="mb-3 p-3 rounded-lg"
      style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-neo-text-dim">
          {cfg.icon} Clé API {cfg.label}
        </span>
        <a href={cfg.keyUrl} target="_blank" rel="noreferrer"
          className="text-[8px] font-mono text-neo-accent hover:underline">
          Obtenir une clé →
        </a>
      </div>
      {saved ? (
        <div className="text-[10px] font-mono text-center py-2" style={{ color: '#34d399' }}>
          ✓ Clé sauvegardée — connexion en cours...
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="password"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder={cfg.keyPlaceholder}
            autoFocus
            className="flex-1 bg-transparent text-[10px] font-mono outline-none text-neo-text placeholder-neo-text-dim px-2 py-1 rounded border border-neo-border"
          />
          <button
            onClick={handleSave}
            disabled={!val.trim()}
            className="text-[9px] font-mono px-3 py-1 rounded transition-all"
            style={{
              background: val.trim() ? 'rgba(99,102,241,0.7)' : 'rgba(99,102,241,0.2)',
              color: val.trim() ? 'white' : '#8892b0',
              border: '1px solid rgba(99,102,241,0.5)',
              cursor: val.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Sauvegarder
          </button>
          <button onClick={onClose}
            className="text-[9px] font-mono px-2 py-1 rounded border border-neo-border text-neo-text-dim hover:text-neo-text transition-colors">
            ✕
          </button>
        </div>
      )}
      {!saved && val && (
        <p className="text-[8px] font-mono mt-1" style={{ color: '#64748b' }}>
          Entrée ou clic sur Sauvegarder pour confirmer
        </p>
      )}
    </motion.div>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────────────────

const PROVIDER_ICON: Record<string, string> = { gemini: '✦', openai: '🤖', claude: '🟣', ollama: '🧬' };

const MessageBubble: React.FC<{ msg: AIMessage; isNew: boolean }> = ({ msg, isNew }) => {
  const isUser = msg.role === 'user';
  const [displayed, setDisplayed] = useState(isNew && !isUser ? '' : msg.content);
  const idxRef = useRef(0);

  useEffect(() => {
    if (!isNew || isUser) return;
    idxRef.current = 0; setDisplayed('');
    const iv = setInterval(() => {
      idxRef.current += 3;
      setDisplayed(msg.content.slice(0, idxRef.current));
      if (idxRef.current >= msg.content.length) clearInterval(iv);
    }, 16);
    return () => clearInterval(iv);
  }, [msg.content, isNew, isUser]);

  const provIcon = PROVIDER_ICON[msg.provider ?? 'ollama'] ?? '🧬';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <span className="text-lg shrink-0 mt-0.5">{provIcon}</span>}
      <div className="max-w-[85%] rounded-xl px-3 py-2 text-[11px] font-mono leading-relaxed"
        style={{
          background: isUser ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
          border: isUser ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.08)',
          color: isUser ? '#c7d2fe' : '#e2e8f0',
        }}>
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{displayed}</div>
        {!isUser && msg.tokens !== undefined && (
          <div className="flex items-center gap-3 mt-1.5 pt-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-[8px] text-neo-text-dim">{msg.provider ?? 'ollama'}</span>
            <span className="text-[8px] text-neo-text-dim">{msg.model?.split(':')[0]}</span>
            <span className="text-[8px] text-neo-text-dim">{msg.tokens} tok</span>
            {msg.duration_ms && <span className="text-[8px] text-neo-text-dim">{(msg.duration_ms / 1000).toFixed(1)}s</span>}
          </div>
        )}
      </div>
      {isUser && <span className="text-lg shrink-0 mt-0.5">👤</span>}
    </motion.div>
  );
};

const ThinkingIndicator: React.FC<{ model: string }> = ({ model }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    className="flex gap-2 justify-start">
    <span className="text-lg shrink-0 mt-0.5">🧬</span>
    <div className="rounded-xl px-3 py-2 text-[11px] font-mono"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-2">
        <span className="text-neo-text-dim">Analyse en cours</span>
        <span className="text-[8px] text-neo-text-dim">({model.split(':')[0]})</span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-neo-accent"
              style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

// ─── Main NeoConsole ──────────────────────────────────────────────────────────

export const NeoConsole: React.FC = () => {
  const {
    messages, isThinking, isWarming, isConnected,
    provider, model, availableModels, apiKeys,
    sendQuery, setModel, setProvider, setApiKey,
    clearMessages, checkStatus, warmup,
  } = useNeoAI();

  const [input, setInput]       = useState('');
  const [showKey, setShowKey]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLTextAreaElement>(null);
  const lastMsgCount            = useRef(0);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isThinking]);

  const handleSend = useCallback(() => {
    const q = input.trim();
    if (!q || isThinking || isWarming) return;
    setInput('');
    sendQuery(q);
    inputRef.current?.focus();
  }, [input, isThinking, isWarming, sendQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const newMsgThreshold = lastMsgCount.current;
  useEffect(() => { lastMsgCount.current = messages.length; }, [messages.length]);

  const currentProviderCfg = PROVIDERS.find((p) => p.id === provider)!;
  const needsKey = currentProviderCfg.requiresKey && !apiKeys[provider];
  const isReady  = isConnected && !isWarming && !needsKey;

  return (
    <Card variant="glass" padding="lg">
      {/* Header row 1: title + status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-mono text-neo-text-dim tracking-wider">🤖 NEO CONSOLE</h3>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{
              background: isConnected ? '#34d399' : '#ef4444',
              boxShadow: isConnected ? '0 0 6px #34d399' : '0 0 6px #ef4444',
            }} />
            <span className="text-[9px] font-mono" style={{ color: isConnected ? '#34d399' : '#ef4444' }}>
              {isConnected
                ? `${currentProviderCfg.icon} ${currentProviderCfg.label.toUpperCase()}`
                : 'OFFLINE'}
            </span>
          </span>
          {isWarming && <span className="text-[9px] font-mono text-neo-text-dim animate-pulse">⏳ CHARGEMENT...</span>}
          {isThinking && !isWarming && <span className="text-[9px] font-mono text-neo-accent animate-pulse">CALCUL EN COURS...</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { checkStatus(); if (provider === 'ollama') warmup(); }}
            className="text-[9px] font-mono text-neo-text-dim hover:text-neo-accent transition-colors" title="Vérifier connexion">⟳</button>
          {currentProviderCfg.requiresKey && (
            <button onClick={() => setShowKey((s) => !s)}
              className="text-[9px] font-mono px-2 py-0.5 rounded transition-colors"
              style={{ background: needsKey ? 'rgba(251,191,36,0.15)' : 'rgba(99,102,241,0.08)', color: needsKey ? '#fbbf24' : '#8892b0', border: `1px solid ${needsKey ? 'rgba(251,191,36,0.4)' : 'rgba(99,102,241,0.2)'}` }}>
              🔑 {needsKey ? 'Clé manquante' : 'Clé API'}
            </button>
          )}
          <button onClick={clearMessages}
            className="text-[9px] font-mono text-neo-text-dim hover:text-neo-danger transition-colors px-2 py-0.5 rounded border border-neo-border">
            CLEAR
          </button>
        </div>
      </div>

      {/* Header row 2: provider tabs + model selector */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <ProviderBar current={provider} onChange={setProvider} disabled={isThinking} />
        <ModelSelector
          current={model} provider={provider}
          ollamaModels={availableModels}
          onChange={setModel} disabled={isThinking}
        />
      </div>

      {/* API Key Panel */}
      <AnimatePresence>
        {showKey && currentProviderCfg.requiresKey && (
          <ApiKeyPanel
            provider={provider}
            apiKeys={apiKeys}
            onSave={setApiKey}
            onClose={() => setShowKey(false)}
          />
        )}
      </AnimatePresence>

      {/* Warming Banner */}
      {isWarming && (
        <div className="mb-3 px-3 py-2 rounded text-[10px] font-mono text-center"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
          ⏳ Chargement de <b>{model.split(':')[0]}</b> en VRAM...
          <span className="text-[9px] text-neo-text-dim ml-2">(30-60s au premier lancement)</span>
        </div>
      )}

      {/* Missing key Banner */}
      {needsKey && !showKey && (
        <div className="mb-3 px-3 py-2 rounded text-[10px] font-mono text-center cursor-pointer"
          onClick={() => setShowKey(true)}
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
          🔑 Clique ici pour saisir ta clé API {currentProviderCfg.label}
        </div>
      )}

      {/* Messages */}
      <div className="space-y-3 overflow-y-auto mb-3 pr-1" style={{ height: '240px', scrollbarWidth: 'thin' }}>
        {messages.length === 0 && !isThinking && !isWarming && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <span className="text-3xl opacity-40">{currentProviderCfg.icon}</span>
            <p className="text-[10px] font-mono text-neo-text-dim">
              {needsKey
                ? `Entre ta clé API ${currentProviderCfg.label} pour activer Neo.`
                : isConnected
                  ? 'Neo est prêt. Pose une question ou utilise une suggestion.'
                  : `${currentProviderCfg.label} hors ligne.`}
            </p>
            {!isConnected && !needsKey && (
              <button onClick={() => { checkStatus(); if (provider === 'ollama') warmup(); }}
                className="text-[9px] font-mono px-2 py-1 rounded mt-1"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>
                ↻ Réessayer
              </button>
            )}
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <MessageBubble key={msg.id} msg={msg} isNew={i >= newMsgThreshold && msg.role === 'assistant'} />
          ))}
          {isThinking && <ThinkingIndicator key="thinking" model={model} />}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Quick Suggestions */}
      {!isThinking && !isWarming && messages.length < 2 && isReady && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {NEO_SUGGESTIONS.map(({ label, prompt }) => (
            <button key={label} onClick={() => sendQuery(prompt)}
              className="text-[9px] font-mono px-2 py-1 rounded transition-all hover:scale-105"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#8892b0' }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 items-end"
        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--neo-border)', borderRadius: '0.75rem', padding: '0.5rem 0.75rem' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isReady ? `Message à Neo (${currentProviderCfg.label})...` : needsKey ? 'Clé API requise...' : 'Connexion...'}
          disabled={!isReady || isThinking}
          rows={2}
          className="flex-1 bg-transparent text-[11px] font-mono outline-none resize-none text-neo-text placeholder-neo-text-dim"
          style={{ opacity: (!isReady || isThinking) ? 0.5 : 1 }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !isReady || isThinking}
          className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all"
          style={{
            background: (!input.trim() || !isReady || isThinking) ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.8)',
            color: (!input.trim() || !isReady || isThinking) ? '#8892b0' : 'white',
            border: '1px solid rgba(99,102,241,0.3)',
            cursor: (!input.trim() || !isReady || isThinking) ? 'not-allowed' : 'pointer',
          }}
        >
          {isThinking ? '⟳' : '↗'}
        </button>
      </div>
      <p className="text-[8px] font-mono text-neo-text-dim mt-1 text-right">
        Entrée → envoyer · Shift+Entrée → nouvelle ligne
      </p>
    </Card>
  );
};
