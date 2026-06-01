// ─── useSystemMetrics Hook ────────────────────────────────────────────────────
// Subscribes to real-time system metrics from the Python native host.
// Polls via Service Worker every ~3 seconds using setInterval.
// Maintains a rolling 60-point history for the oscilloscope chart.

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SystemMetrics {
  cpu_percent: number;
  memory_percent: number;
  memory_used_mb: number;
  memory_total_mb: number;
  disk_percent: number;
  disk_used_gb: number;
  disk_total_gb: number;
  network_sent_mb: number;
  network_recv_mb: number;
  top_processes: Array<{
    pid: number;
    name: string;
    cpu_percent: number;
    memory_percent: number;
  }>;
  panic: {
    panic: boolean;
    level: string;
    reason: string;
    recovering: boolean;
    consecutive: number;
  };
  latency_ms: number;
  timestamp: string;
}

export interface MetricsHistoryPoint {
  ts: number;
  cpu: number;
  ram: number;
  disk: number;
}

export interface UseSystemMetricsReturn {
  current: SystemMetrics | null;
  history: MetricsHistoryPoint[];
  isConnected: boolean;
  isPanic: boolean;
  panicLevel: string;
  panicReason: string;
  error: string | null;
  lastUpdate: number | null;
  manualPoll: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 3000; // 3 seconds

export function useSystemMetrics(): UseSystemMetricsReturn {
  const [current, setCurrent]       = useState<SystemMetrics | null>(null);
  const [history, setHistory]       = useState<MetricsHistoryPoint[]>([]);
  const [isConnected, setConnected] = useState(false);
  const [isPanic, setPanic]         = useState(false);
  const [panicLevel, setPanicLevel] = useState('NORMAL');
  const [panicReason, setPanicReason] = useState('');
  const [error, setError]           = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef  = useRef(true);

  // ── Send a message to the Service Worker ──────────────────────────────────
  const sendMessage = useCallback(
    (type: string, payload?: unknown): Promise<unknown> => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { type, source: 'dashboard', payload, timestamp: Date.now() },
          (response) => {
            if (chrome.runtime.lastError) {
              resolve({ success: false, error: chrome.runtime.lastError.message });
            } else {
              resolve(response);
            }
          }
        );
      });
    },
    []
  );

  // ── Poll metrics from the Service Worker ──────────────────────────────────
  const poll = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const response = (await sendMessage('METRICS_POLL')) as {
        success: boolean;
        data?: {
          neo_system_metrics: SystemMetrics | null;
          neo_metrics_history: MetricsHistoryPoint[];
          neo_bridge_connected: boolean;
          neo_panic_state: { panic: boolean; level: string; reason: string };
        };
        error?: string;
      };

      if (!mountedRef.current) return;

      if (response.success && response.data) {
        const { neo_system_metrics, neo_metrics_history, neo_bridge_connected, neo_panic_state } =
          response.data;

        if (neo_system_metrics) {
          setCurrent(neo_system_metrics);
          setLastUpdate(Date.now());
        }
        if (neo_metrics_history) {
          setHistory(neo_metrics_history);
        }
        setConnected(neo_bridge_connected ?? false);

        if (neo_panic_state) {
          setPanic(neo_panic_state.panic);
          setPanicLevel(neo_panic_state.level || 'NORMAL');
          setPanicReason(neo_panic_state.reason || '');
        }
        setError(null);
      } else {
        setConnected(false);
        setError(response.error || 'Bridge unreachable');
      }
    } catch (err) {
      if (mountedRef.current) {
        setConnected(false);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
  }, [sendMessage]);

  // ── Listen for storage changes (theme driven by SW panic handler) ─────────
  useEffect(() => {
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.neo_panic_state) {
        const ps = changes.neo_panic_state.newValue;
        if (ps) {
          setPanic(ps.panic);
          setPanicLevel(ps.level || 'NORMAL');
          setPanicReason(ps.reason || '');
        }
      }
      if (changes.neo_bridge_connected) {
        setConnected(changes.neo_bridge_connected.newValue ?? false);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // ── Lifecycle: subscribe on mount, unsubscribe on unmount ─────────────────
  useEffect(() => {
    mountedRef.current = true;

    // Subscribe: starts the SW alarm + first poll
    sendMessage('METRICS_SUBSCRIBE').catch(console.warn);

    // Immediate local poll
    poll();

    // Set up client-side polling every 3s
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Unsubscribe: stops the SW alarm
      sendMessage('METRICS_UNSUBSCRIBE').catch(console.warn);
    };
  }, [poll, sendMessage]);

  return {
    current,
    history,
    isConnected,
    isPanic,
    panicLevel,
    panicReason,
    error,
    lastUpdate,
    manualPoll: poll,
  };
}
