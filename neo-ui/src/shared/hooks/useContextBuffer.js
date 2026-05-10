// ─── useContextBuffer Hook ────────────────────────────────────────────────────
// Reads and manages the Phase-4-ready AI context buffer stored in chrome.storage.
// The buffer accumulates user events (tasks, probes, focus sessions, commands)
// and will serve as the initial context for the Ollama AI in Phase 4.
import { useState, useEffect, useCallback } from 'react';
const EVENT_ICONS = {
    focus_started: '⏱️',
    focus_session_completed: '✅',
    task_completed: '📋',
    probe_executed: '🕷️',
    command_executed: '💻',
    panic_triggered: '🔴',
    panic_recovered: '💚',
};
const EVENT_LABELS = {
    focus_started: 'Focus démarré',
    focus_session_completed: 'Session Focus terminée',
    task_completed: 'Tâche complétée',
    probe_executed: 'Probe exécutée',
    command_executed: 'Commande exécutée',
    panic_triggered: 'Surcharge détectée',
    panic_recovered: 'Système stabilisé',
};
// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useContextBuffer() {
    const [events, setEvents] = useState([]);
    // Initial load
    useEffect(() => {
        chrome.storage.local.get('neo_context_buffer', (result) => {
            setEvents(result.neo_context_buffer || []);
        });
        // Live updates
        const listener = (changes) => {
            if (changes.neo_context_buffer) {
                setEvents(changes.neo_context_buffer.newValue || []);
            }
        };
        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }, []);
    const clear = useCallback(async () => {
        await chrome.storage.local.set({ neo_context_buffer: [] });
        setEvents([]);
    }, []);
    const getIcon = useCallback((type) => EVENT_ICONS[type] ?? '📌', []);
    const getLabel = useCallback((type) => EVENT_LABELS[type] ?? type.replace(/_/g, ' '), []);
    return {
        events: [...events].reverse(), // most recent first
        totalCount: events.length,
        clear,
        getIcon,
        getLabel,
    };
}
//# sourceMappingURL=useContextBuffer.js.map