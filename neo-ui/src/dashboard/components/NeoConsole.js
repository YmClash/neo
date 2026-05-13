import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@shared/components';
import { useNeoAI, NEO_SUGGESTIONS, PROVIDERS, } from '@shared/hooks';
// ─── Provider Tab Bar ─────────────────────────────────────────────────────────
const ProviderBar = ({ current, onChange, disabled }) => (_jsx("div", { className: "flex gap-1", children: PROVIDERS.map((p) => (_jsxs("button", { onClick: () => !disabled && onChange(p.id), title: p.label, className: "flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded transition-all", style: {
            background: current === p.id ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.06)',
            border: `1px solid ${current === p.id ? 'rgba(99,102,241,0.6)' : 'rgba(99,102,241,0.15)'}`,
            color: current === p.id ? '#818cf8' : '#8892b0',
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
        }, children: [p.icon, " ", p.id === 'ollama' ? 'Local' : p.label.split(' ')[1]] }, p.id))) }));
// ─── Model Selector ───────────────────────────────────────────────────────────
const ModelSelector = ({ current, provider, ollamaModels, onChange, disabled }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const cfg = PROVIDERS.find((p) => p.id === provider);
    const modelList = provider === 'ollama'
        ? ollamaModels.map((m) => ({ id: m.name, label: `${m.name.split(':')[0]} (${m.params})` }))
        : cfg.models;
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target))
            setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    const displayName = current.split(':')[0];
    return (_jsxs("div", { ref: ref, className: "relative", children: [_jsxs("button", { onClick: () => setOpen((o) => !o), disabled: disabled, className: "flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded transition-all", style: {
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#8892b0',
                    opacity: disabled ? 0.5 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                }, children: [_jsx("span", { children: displayName }), _jsx("span", { style: { opacity: 0.6 }, children: "\u25BE" })] }), _jsx(AnimatePresence, { children: open && (_jsx(motion.div, { initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 }, className: "absolute right-0 top-full mt-1 z-50 rounded-lg overflow-hidden", style: { minWidth: '200px', background: 'rgba(14,20,40,0.97)', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }, children: modelList.length === 0
                        ? _jsx("div", { className: "px-3 py-2 text-[9px] font-mono text-neo-text-dim", children: "Aucun mod\u00E8le d\u00E9tect\u00E9" })
                        : modelList.map((m) => (_jsx("button", { onClick: () => { onChange(m.id); setOpen(false); }, className: "w-full text-left px-3 py-1.5 text-[9px] font-mono transition-colors", style: {
                                background: m.id === current ? 'rgba(99,102,241,0.15)' : 'transparent',
                                color: m.id === current ? '#818cf8' : '#8892b0',
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                            }, children: m.label }, m.id))) })) })] }));
};
// ─── API Key Panel ────────────────────────────────────────────────────────────
const ApiKeyPanel = ({ provider, apiKeys, onSave, onClose }) => {
    const cfg = PROVIDERS.find((p) => p.id === provider);
    const [val, setVal] = useState(apiKeys[provider] ?? '');
    const [saved, setSaved] = useState(false);
    const handleSave = () => {
        if (!val.trim())
            return;
        onSave(provider, val);
        setSaved(true);
        // Give storage 600ms to propagate before closing
        setTimeout(() => onClose(), 600);
    };
    return (_jsxs(motion.div, { initial: { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, className: "mb-3 p-3 rounded-lg", style: { background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }, children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("span", { className: "text-[10px] font-mono text-neo-text-dim", children: [cfg.icon, " Cl\u00E9 API ", cfg.label] }), _jsx("a", { href: cfg.keyUrl, target: "_blank", rel: "noreferrer", className: "text-[8px] font-mono text-neo-accent hover:underline", children: "Obtenir une cl\u00E9 \u2192" })] }), saved ? (_jsx("div", { className: "text-[10px] font-mono text-center py-2", style: { color: '#34d399' }, children: "\u2713 Cl\u00E9 sauvegard\u00E9e \u2014 connexion en cours..." })) : (_jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "password", value: val, onChange: (e) => setVal(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleSave(), placeholder: cfg.keyPlaceholder, autoFocus: true, className: "flex-1 bg-transparent text-[10px] font-mono outline-none text-neo-text placeholder-neo-text-dim px-2 py-1 rounded border border-neo-border" }), _jsx("button", { onClick: handleSave, disabled: !val.trim(), className: "text-[9px] font-mono px-3 py-1 rounded transition-all", style: {
                            background: val.trim() ? 'rgba(99,102,241,0.7)' : 'rgba(99,102,241,0.2)',
                            color: val.trim() ? 'white' : '#8892b0',
                            border: '1px solid rgba(99,102,241,0.5)',
                            cursor: val.trim() ? 'pointer' : 'not-allowed',
                        }, children: "Sauvegarder" }), _jsx("button", { onClick: onClose, className: "text-[9px] font-mono px-2 py-1 rounded border border-neo-border text-neo-text-dim hover:text-neo-text transition-colors", children: "\u2715" })] })), !saved && val && (_jsx("p", { className: "text-[8px] font-mono mt-1", style: { color: '#64748b' }, children: "Entr\u00E9e ou clic sur Sauvegarder pour confirmer" }))] }));
};
// ─── Message Bubble ───────────────────────────────────────────────────────────
const PROVIDER_ICON = { gemini: '✦', openai: '🤖', claude: '🟣', ollama: '🧬' };
const MessageBubble = ({ msg, isNew }) => {
    const isUser = msg.role === 'user';
    const [displayed, setDisplayed] = useState(isNew && !isUser ? '' : msg.content);
    const idxRef = useRef(0);
    useEffect(() => {
        if (!isNew || isUser)
            return;
        idxRef.current = 0;
        setDisplayed('');
        const iv = setInterval(() => {
            idxRef.current += 3;
            setDisplayed(msg.content.slice(0, idxRef.current));
            if (idxRef.current >= msg.content.length)
                clearInterval(iv);
        }, 16);
        return () => clearInterval(iv);
    }, [msg.content, isNew, isUser]);
    const provIcon = PROVIDER_ICON[msg.provider ?? 'ollama'] ?? '🧬';
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, className: `flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`, children: [!isUser && _jsx("span", { className: "text-lg shrink-0 mt-0.5", children: provIcon }), _jsxs("div", { className: "max-w-[85%] rounded-xl px-3 py-2 text-[11px] font-mono leading-relaxed", style: {
                    background: isUser ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                    border: isUser ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.08)',
                    color: isUser ? '#c7d2fe' : '#e2e8f0',
                }, children: [_jsx("div", { style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' }, children: displayed }), !isUser && msg.tokens !== undefined && (_jsxs("div", { className: "flex items-center gap-3 mt-1.5 pt-1.5", style: { borderTop: '1px solid rgba(255,255,255,0.06)' }, children: [_jsx("span", { className: "text-[8px] text-neo-text-dim", children: msg.provider ?? 'ollama' }), _jsx("span", { className: "text-[8px] text-neo-text-dim", children: msg.model?.split(':')[0] }), _jsxs("span", { className: "text-[8px] text-neo-text-dim", children: [msg.tokens, " tok"] }), msg.duration_ms && _jsxs("span", { className: "text-[8px] text-neo-text-dim", children: [(msg.duration_ms / 1000).toFixed(1), "s"] })] }))] }), isUser && _jsx("span", { className: "text-lg shrink-0 mt-0.5", children: "\uD83D\uDC64" })] }));
};
const ThinkingIndicator = ({ model }) => (_jsxs(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, className: "flex gap-2 justify-start", children: [_jsx("span", { className: "text-lg shrink-0 mt-0.5", children: "\uD83E\uDDEC" }), _jsx("div", { className: "rounded-xl px-3 py-2 text-[11px] font-mono", style: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-neo-text-dim", children: "Analyse en cours" }), _jsxs("span", { className: "text-[8px] text-neo-text-dim", children: ["(", model.split(':')[0], ")"] }), _jsx("div", { className: "flex gap-1", children: [0, 1, 2].map((i) => (_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-neo-accent", style: { animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` } }, i))) })] }) })] }));
// ─── Main NeoConsole ──────────────────────────────────────────────────────────
export const NeoConsole = () => {
    const { messages, isThinking, isWarming, isConnected, provider, model, availableModels, apiKeys, sendQuery, setModel, setProvider, setApiKey, clearMessages, checkStatus, warmup, } = useNeoAI();
    const [input, setInput] = useState('');
    const [showKey, setShowKey] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const lastMsgCount = useRef(0);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isThinking]);
    const handleSend = useCallback(() => {
        const q = input.trim();
        if (!q || isThinking || isWarming)
            return;
        setInput('');
        sendQuery(q);
        inputRef.current?.focus();
    }, [input, isThinking, isWarming, sendQuery]);
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    const newMsgThreshold = lastMsgCount.current;
    useEffect(() => { lastMsgCount.current = messages.length; }, [messages.length]);
    const currentProviderCfg = PROVIDERS.find((p) => p.id === provider);
    const needsKey = currentProviderCfg.requiresKey && !apiKeys[provider];
    const isReady = isConnected && !isWarming && !needsKey;
    return (_jsxs(Card, { variant: "glass", padding: "lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "text-xs font-mono text-neo-text-dim tracking-wider", children: "\uD83E\uDD16 NEO CONSOLE" }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "w-2 h-2 rounded-full", style: {
                                            background: isConnected ? '#34d399' : '#ef4444',
                                            boxShadow: isConnected ? '0 0 6px #34d399' : '0 0 6px #ef4444',
                                        } }), _jsx("span", { className: "text-[9px] font-mono", style: { color: isConnected ? '#34d399' : '#ef4444' }, children: isConnected
                                            ? `${currentProviderCfg.icon} ${currentProviderCfg.label.toUpperCase()}`
                                            : 'OFFLINE' })] }), isWarming && _jsx("span", { className: "text-[9px] font-mono text-neo-text-dim animate-pulse", children: "\u23F3 CHARGEMENT..." }), isThinking && !isWarming && _jsx("span", { className: "text-[9px] font-mono text-neo-accent animate-pulse", children: "CALCUL EN COURS..." })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => { checkStatus(); if (provider === 'ollama')
                                    warmup(); }, className: "text-[9px] font-mono text-neo-text-dim hover:text-neo-accent transition-colors", title: "V\u00E9rifier connexion", children: "\u27F3" }), currentProviderCfg.requiresKey && (_jsxs("button", { onClick: () => setShowKey((s) => !s), className: "text-[9px] font-mono px-2 py-0.5 rounded transition-colors", style: { background: needsKey ? 'rgba(251,191,36,0.15)' : 'rgba(99,102,241,0.08)', color: needsKey ? '#fbbf24' : '#8892b0', border: `1px solid ${needsKey ? 'rgba(251,191,36,0.4)' : 'rgba(99,102,241,0.2)'}` }, children: ["\uD83D\uDD11 ", needsKey ? 'Clé manquante' : 'Clé API'] })), _jsx("button", { onClick: clearMessages, className: "text-[9px] font-mono text-neo-text-dim hover:text-neo-danger transition-colors px-2 py-0.5 rounded border border-neo-border", children: "CLEAR" })] })] }), _jsxs("div", { className: "flex items-center justify-between mb-3 gap-2", children: [_jsx(ProviderBar, { current: provider, onChange: setProvider, disabled: isThinking }), _jsx(ModelSelector, { current: model, provider: provider, ollamaModels: availableModels, onChange: setModel, disabled: isThinking })] }), _jsx(AnimatePresence, { children: showKey && currentProviderCfg.requiresKey && (_jsx(ApiKeyPanel, { provider: provider, apiKeys: apiKeys, onSave: setApiKey, onClose: () => setShowKey(false) })) }), isWarming && (_jsxs("div", { className: "mb-3 px-3 py-2 rounded text-[10px] font-mono text-center", style: { background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }, children: ["\u23F3 Chargement de ", _jsx("b", { children: model.split(':')[0] }), " en VRAM...", _jsx("span", { className: "text-[9px] text-neo-text-dim ml-2", children: "(30-60s au premier lancement)" })] })), needsKey && !showKey && (_jsxs("div", { className: "mb-3 px-3 py-2 rounded text-[10px] font-mono text-center cursor-pointer", onClick: () => setShowKey(true), style: { background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }, children: ["\uD83D\uDD11 Clique ici pour saisir ta cl\u00E9 API ", currentProviderCfg.label] })), _jsxs("div", { className: "space-y-3 overflow-y-auto mb-3 pr-1", style: { height: '240px', scrollbarWidth: 'thin' }, children: [messages.length === 0 && !isThinking && !isWarming && (_jsxs("div", { className: "flex flex-col items-center justify-center h-full gap-2 text-center", children: [_jsx("span", { className: "text-3xl opacity-40", children: currentProviderCfg.icon }), _jsx("p", { className: "text-[10px] font-mono text-neo-text-dim", children: needsKey
                                    ? `Entre ta clé API ${currentProviderCfg.label} pour activer Neo.`
                                    : isConnected
                                        ? 'Neo est prêt. Pose une question ou utilise une suggestion.'
                                        : `${currentProviderCfg.label} hors ligne.` }), !isConnected && !needsKey && (_jsx("button", { onClick: () => { checkStatus(); if (provider === 'ollama')
                                    warmup(); }, className: "text-[9px] font-mono px-2 py-1 rounded mt-1", style: { background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }, children: "\u21BB R\u00E9essayer" }))] })), _jsxs(AnimatePresence, { initial: false, children: [messages.map((msg, i) => (_jsx(MessageBubble, { msg: msg, isNew: i >= newMsgThreshold && msg.role === 'assistant' }, msg.id))), isThinking && _jsx(ThinkingIndicator, { model: model }, "thinking")] }), _jsx("div", { ref: bottomRef })] }), !isThinking && !isWarming && messages.length < 2 && isReady && (_jsx("div", { className: "flex flex-wrap gap-1.5 mb-3", children: NEO_SUGGESTIONS.map(({ label, prompt }) => (_jsx("button", { onClick: () => sendQuery(prompt), className: "text-[9px] font-mono px-2 py-1 rounded transition-all hover:scale-105", style: { background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#8892b0' }, children: label }, label))) })), _jsxs("div", { className: "flex gap-2 items-end", style: { background: 'rgba(0,0,0,0.4)', border: '1px solid var(--neo-border)', borderRadius: '0.75rem', padding: '0.5rem 0.75rem' }, children: [_jsx("textarea", { ref: inputRef, value: input, onChange: (e) => setInput(e.target.value), onKeyDown: handleKeyDown, placeholder: isReady ? `Message à Neo (${currentProviderCfg.label})...` : needsKey ? 'Clé API requise...' : 'Connexion...', disabled: !isReady || isThinking, rows: 2, className: "flex-1 bg-transparent text-[11px] font-mono outline-none resize-none text-neo-text placeholder-neo-text-dim", style: { opacity: (!isReady || isThinking) ? 0.5 : 1 } }), _jsx("button", { onClick: handleSend, disabled: !input.trim() || !isReady || isThinking, className: "shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all", style: {
                            background: (!input.trim() || !isReady || isThinking) ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.8)',
                            color: (!input.trim() || !isReady || isThinking) ? '#8892b0' : 'white',
                            border: '1px solid rgba(99,102,241,0.3)',
                            cursor: (!input.trim() || !isReady || isThinking) ? 'not-allowed' : 'pointer',
                        }, children: isThinking ? '⟳' : '↗' })] }), _jsx("p", { className: "text-[8px] font-mono text-neo-text-dim mt-1 text-right", children: "Entr\u00E9e \u2192 envoyer \u00B7 Shift+Entr\u00E9e \u2192 nouvelle ligne" })] }));
};
//# sourceMappingURL=NeoConsole.js.map