// ─── useContextBuffer Hook ────────────────────────────────────────────────────
// Reads and manages the Phase-4-ready AI context buffer stored in chrome.storage.
// The buffer accumulates user events (tasks, probes, focus sessions, commands)
// and will serve as the initial context for the Ollama AI in Phase 4.

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContextEvent {
  ts: number;
  type: string;
  data: Record<string, unknown>;
}

const EVENT_ICONS: Record<string, string> = {
  focus_started:           '⏱️',
  focus_session_completed: '✅',
  task_completed:          '📋',
  probe_executed:          '🕷️',
  command_executed:        '💻',
  panic_triggered:         '🔴',
  panic_recovered:         '💚',
};

const EVENT_LABELS: Record<string, string> = {
  focus_started:           'Focus démarré',
  focus_session_completed: 'Session Focus terminée',
  task_completed:          'Tâche complétée',
  probe_executed:          'Probe exécutée',
  command_executed:        'Commande exécutée',
  panic_triggered:         'Surcharge détectée',
  panic_recovered:         'Système stabilisé',
};

export interface UseContextBufferReturn {
  events: ContextEvent[];
  totalCount: number;
  clear: () => Promise<void>;
  getIcon: (type: string) => string;
  getLabel: (type: string) => string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useContextBuffer(): UseContextBufferReturn {
  const [events, setEvents] = useState<ContextEvent[]>([]);

  // Initial load
  useEffect(() => {
    chrome.storage.local.get('neo_context_buffer', (result) => {
      setEvents((result.neo_context_buffer as ContextEvent[]) || []);
    });

    // Live updates
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.neo_context_buffer) {
        setEvents((changes.neo_context_buffer.newValue as ContextEvent[]) || []);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const clear = useCallback(async () => {
    await chrome.storage.local.set({ neo_context_buffer: [] });
    setEvents([]);
  }, []);

  const getIcon = useCallback((type: string) => EVENT_ICONS[type] ?? '📌', []);
  const getLabel = useCallback((type: string) => EVENT_LABELS[type] ?? type.replace(/_/g, ' '), []);

  return {
    events: [...events].reverse(), // most recent first
    totalCount: events.length,
    clear,
    getIcon,
    getLabel,
  };
}
