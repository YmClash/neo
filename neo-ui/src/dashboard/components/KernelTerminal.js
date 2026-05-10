import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Card } from '@shared/components';
const QUICK_COMMANDS = [
    { label: 'systeminfo', cmd: 'systeminfo | findstr /B /C:"OS" /C:"Total Physical"' },
    { label: 'ipconfig', cmd: 'ipconfig /all | findstr /B /C:"IPv4" /C:"Subnet" /C:"Default"' },
    { label: 'tasklist', cmd: 'tasklist /FO TABLE /NH | sort /R' },
    { label: 'ping', cmd: 'ping -n 4 8.8.8.8' },
    { label: 'dir', cmd: 'dir /w %USERPROFILE%' },
    { label: 'netstat', cmd: 'netstat -ano | findstr ESTABLISHED | findstr /V "127.0.0.1"' },
];
let _lineId = 0;
function newLine(type, content, returncode) {
    return { id: _lineId++, type, content, returncode, ts: new Date().toLocaleTimeString('fr-FR') };
}
// ─── Kernel Terminal Component ────────────────────────────────────────────────
export const KernelTerminal = () => {
    const [lines, setLines] = useState([
        newLine('system', 'Neo Kernel Terminal v0.2.0 — Sandboxed Shell'),
        newLine('system', 'Type a command or use the shortcuts below. Commands are executed on the local machine.'),
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [histIdx, setHistIdx] = useState(-1);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    // Auto-scroll on new output
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lines]);
    const appendLine = (line) => setLines((prev) => [...prev.slice(-150), line]);
    const sendMessage = (type, payload) => new Promise((resolve) => {
        chrome.runtime.sendMessage({ type, source: 'dashboard', payload, timestamp: Date.now() }, (response) => resolve(response));
    });
    const runCommand = async (cmd) => {
        const trimmed = cmd.trim();
        if (!trimmed)
            return;
        // Add to history
        setHistory((prev) => [trimmed, ...prev.slice(0, 49)]);
        setHistIdx(-1);
        appendLine(newLine('input', `$ ${trimmed}`));
        setInput('');
        setLoading(true);
        try {
            const response = (await sendMessage('BRIDGE_COMMAND', { action: 'execute', command: trimmed, timeout: 10 }));
            if (response.success && response.data?.data) {
                const { stdout, stderr, returncode } = response.data.data;
                if (stdout.trim()) {
                    stdout.trim().split('\n').forEach((l) => appendLine(newLine('output', l, returncode)));
                }
                if (stderr.trim()) {
                    stderr.trim().split('\n').forEach((l) => appendLine(newLine('error', l)));
                }
                if (!stdout.trim() && !stderr.trim()) {
                    appendLine(newLine('output', `(exit code: ${returncode})`));
                }
            }
            else if (response.data?.type === 'error') {
                appendLine(newLine('error', `⛔ ${response.data.message}`));
            }
            else {
                appendLine(newLine('error', response.error ?? 'Bridge error — host unreachable'));
            }
        }
        catch (err) {
            appendLine(newLine('error', `Erreur : ${err instanceof Error ? err.message : String(err)}`));
        }
        finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            runCommand(input);
            return;
        }
        if (e.key === 'ArrowUp') {
            const idx = Math.min(histIdx + 1, history.length - 1);
            setHistIdx(idx);
            setInput(history[idx] ?? '');
            return;
        }
        if (e.key === 'ArrowDown') {
            const idx = Math.max(histIdx - 1, -1);
            setHistIdx(idx);
            setInput(idx === -1 ? '' : history[idx]);
            return;
        }
        if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            setLines([]);
        }
    };
    const lineColor = (type, rc) => {
        if (type === 'input')
            return '#818cf8';
        if (type === 'system')
            return '#8892b0';
        if (type === 'error')
            return '#f87171';
        if (rc !== undefined && rc !== 0)
            return '#fb923c';
        return '#e2e8f0';
    };
    return (_jsxs(Card, { variant: "glass", padding: "lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-xs font-mono text-neo-text-dim tracking-wider", children: "\uD83D\uDCBB KERNEL TERMINAL \u2014 SANDBOXED" }), _jsx("button", { onClick: () => setLines([]), className: "text-[9px] font-mono text-neo-text-dim hover:text-neo-accent transition-colors px-2 py-0.5 rounded border border-neo-border", children: "CLEAR" })] }), _jsx("div", { className: "flex flex-wrap gap-1.5 mb-3", children: QUICK_COMMANDS.map(({ label, cmd }) => (_jsx("button", { onClick: () => runCommand(cmd), disabled: loading, className: "text-[9px] font-mono px-2 py-1 rounded transition-all", style: {
                        background: 'rgba(99,102,241,0.1)',
                        border: '1px solid rgba(99,102,241,0.3)',
                        color: '#818cf8',
                        opacity: loading ? 0.4 : 1,
                        cursor: loading ? 'not-allowed' : 'pointer',
                    }, children: label }, label))) }), _jsxs("div", { className: "rounded font-mono text-[10px] overflow-y-auto mb-3 p-3 space-y-0.5", style: {
                    height: '180px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid var(--neo-border)',
                    scrollbarWidth: 'thin',
                }, children: [lines.map((line) => (_jsxs("div", { className: "flex gap-2 leading-relaxed", children: [_jsx("span", { className: "text-neo-text-dim shrink-0 text-[8px] pt-0.5", children: line.ts }), _jsx("span", { style: { color: lineColor(line.type, line.returncode), wordBreak: 'break-all' }, children: line.content })] }, line.id))), loading && (_jsxs("div", { className: "flex gap-1 items-center text-neo-text-dim", children: [_jsx("span", { className: "animate-pulse", children: "\u25B6" }), _jsx("span", { className: "animate-pulse", style: { animationDelay: '0.2s' }, children: "\u25B6" }), _jsx("span", { className: "animate-pulse", style: { animationDelay: '0.4s' }, children: "\u25B6" })] })), _jsx("div", { ref: bottomRef })] }), _jsxs("div", { className: "flex items-center gap-2", style: { background: 'rgba(0,0,0,0.5)', border: '1px solid var(--neo-border)', borderRadius: '0.5rem', padding: '0.4rem 0.75rem' }, children: [_jsx("span", { className: "text-[10px] font-mono text-neo-accent shrink-0", children: "neo@kernel:~$" }), _jsx("input", { ref: inputRef, type: "text", value: input, onChange: (e) => setInput(e.target.value), onKeyDown: handleKeyDown, placeholder: "Entrez une commande...", disabled: loading, className: "flex-1 bg-transparent text-[10px] font-mono outline-none text-neo-text placeholder-neo-text-dim", autoComplete: "off", spellCheck: false }), loading && _jsx("span", { className: "text-[10px] text-neo-text-dim animate-spin", children: "\u27F3" })] }), _jsx("p", { className: "text-[8px] font-mono text-neo-text-dim mt-1.5 text-right", children: "\u2191\u2193 historique \u00B7 Ctrl+L effacer \u00B7 Entr\u00E9e ex\u00E9cuter" })] }));
};
//# sourceMappingURL=KernelTerminal.js.map