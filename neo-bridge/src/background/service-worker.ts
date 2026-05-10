// ═══════════════════════════════════════════════════════════════════════════════
// Neo Service Worker — The Central Brain v0.2.0 (Phase 3)
// ═══════════════════════════════════════════════════════════════════════════════
// Manages: module lifecycle, message routing, WASM bridge, alarms, notifications,
//          native messaging polling, panic detection, and Phase-4-ready context buffer.
// Manifest V3 — event-driven, stateless between wake-ups.

import { handleAlarms, registerAlarms } from './alarms';
import { showNotification } from './notifications';
import { ModuleManager } from './moduleManager';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NeoMessage {
  type: string;
  source: string;
  payload?: unknown;
  timestamp: number;
}

interface NeoResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

interface ContextEvent {
  ts: number;
  type: string;
  data: Record<string, unknown>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NATIVE_HOST_NAME = 'com.neo.bridge';
const METRICS_ALARM   = 'neo-metrics-poll';
const BUFFER_MAX_SIZE = 50;       // Max events in context buffer

// ─── Module Manager Instance ──────────────────────────────────────────────────

const moduleManager = new ModuleManager();

// ─── Lifecycle Events ─────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Neo SW] 🧬 Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    await chrome.storage.local.set({
      neo_theme: 'egghead',
      neo_modules: getDefaultModules(),
      neo_tasks: [],
      neo_settings: {
        notifications: true,
        autoStart: false,
      },
      neo_system_metrics: null,
      neo_metrics_history: [],
      neo_context_buffer: [],
      neo_bridge_connected: false,
      neo_panic_state: { panic: false, level: 'NORMAL', reason: '' },
    });

    showNotification(
      'neo-welcome',
      'Neo — Online',
      '🧬 Systèmes initialisés. Extension prête.',
      'normal'
    );
  }

  registerAlarms();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[Neo SW] 🔄 Browser startup detected.');
  registerAlarms();
});

// ─── Message Router ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: NeoMessage, sender, sendResponse: (response: NeoResponse) => void) => {
    console.log(`[Neo SW] 📨 Message: ${message.type} from ${message.source}`);

    handleMessage(message, sender)
      .then((response) => sendResponse(response))
      .catch((error) => {
        console.error('[Neo SW] Message handler error:', error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        });
      });

    return true; // async response
  }
);

async function handleMessage(
  message: NeoMessage,
  _sender: chrome.runtime.MessageSender
): Promise<NeoResponse> {
  switch (message.type) {

    // ─── System ───────────────────────────────────────────────
    case 'NEO_INIT':
      return {
        success: true,
        data: {
          version: '0.2.0',
          modules: await moduleManager.getModules(),
        },
        timestamp: Date.now(),
      };

    // ─── Modules ──────────────────────────────────────────────
    case 'GET_MODULES':
      return {
        success: true,
        data: await moduleManager.getModules(),
        timestamp: Date.now(),
      };

    case 'MODULE_TOGGLE': {
      const { moduleId, enabled } = message.payload as {
        moduleId: string;
        enabled: boolean;
      };
      await moduleManager.toggleModule(moduleId, enabled);
      return { success: true, data: { moduleId, enabled }, timestamp: Date.now() };
    }

    case 'MODULE_CONFIG': {
      const { moduleId: configModuleId, config } = message.payload as {
        moduleId: string;
        config: Record<string, unknown>;
      };
      await moduleManager.updateConfig(configModuleId, config);
      return { success: true, data: { moduleId: configModuleId }, timestamp: Date.now() };
    }

    // ─── Theme ────────────────────────────────────────────────
    case 'THEME_CHANGE': {
      const { theme } = message.payload as { theme: string };
      await chrome.storage.local.set({ neo_theme: theme });
      return { success: true, data: { theme }, timestamp: Date.now() };
    }

    case 'THEME_GET': {
      const result = await chrome.storage.local.get('neo_theme');
      return {
        success: true,
        data: { theme: result.neo_theme || 'egghead' },
        timestamp: Date.now(),
      };
    }

    // ─── Bridge / Native Messaging ────────────────────────────
    case 'BRIDGE_COMMAND': {
      try {
        const response = await sendNativeMessage(message.payload);
        return { success: true, data: response, timestamp: Date.now() };
      } catch (error) {
        await chrome.storage.local.set({ neo_bridge_connected: false });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Bridge error',
          timestamp: Date.now(),
        };
      }
    }

    case 'BRIDGE_PING': {
      try {
        const response = await sendNativeMessage({ action: 'ping' });
        await chrome.storage.local.set({ neo_bridge_connected: true });
        return { success: true, data: response, timestamp: Date.now() };
      } catch (error) {
        await chrome.storage.local.set({ neo_bridge_connected: false });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Bridge unreachable',
          timestamp: Date.now(),
        };
      }
    }

    // ─── Metrics Subscription (real-time polling) ─────────────
    case 'METRICS_SUBSCRIBE': {
      // Start polling alarm (Chrome alarm minimum is 1 minute,
      // so we use a 1-minute alarm but also do an immediate poll)
      chrome.alarms.create(METRICS_ALARM, { periodInMinutes: 1 });
      // Immediate first poll
      await pollSystemMetrics();
      return { success: true, data: { polling: true }, timestamp: Date.now() };
    }

    case 'METRICS_UNSUBSCRIBE': {
      chrome.alarms.clear(METRICS_ALARM);
      return { success: true, data: { polling: false }, timestamp: Date.now() };
    }

    case 'METRICS_POLL': {
      // Manual poll request from the UI (called by the hook every 3s via setInterval)
      await pollSystemMetrics();
      const result = await chrome.storage.local.get([
        'neo_system_metrics',
        'neo_metrics_history',
        'neo_bridge_connected',
        'neo_panic_state',
      ]);
      return { success: true, data: result, timestamp: Date.now() };
    }

    // ─── Focus Timer ──────────────────────────────────────────
    case 'FOCUS_START': {
      const { minutes } = message.payload as { minutes: number };
      const sessionId = Date.now().toString();
      import('./alarms').then(({ createFocusAlarm }) => {
        createFocusAlarm(sessionId, minutes);
      });
      await appendToContextBuffer('focus_started', { minutes, sessionId });
      return { success: true, data: { sessionId, minutes }, timestamp: Date.now() };
    }

    case 'FOCUS_STOP': {
      chrome.alarms.getAll((alarms) => {
        alarms.forEach((alarm) => {
          if (alarm.name.startsWith('neo-focus-')) {
            chrome.alarms.clear(alarm.name);
          }
        });
      });
      return { success: true, timestamp: Date.now() };
    }

    case 'FOCUS_COMPLETE': {
      const { duration } = message.payload as { duration: number };
      await appendToContextBuffer('focus_session_completed', { duration_minutes: duration });
      return { success: true, timestamp: Date.now() };
    }

    // ─── Web Probes ───────────────────────────────────────────
    case 'PROBE_COMPLETE': {
      const { url, itemCount, sentiment } = message.payload as {
        url: string;
        itemCount: number;
        sentiment?: { score: number; label: string };
      };
      import('./notifications').then(({ notifyProbeResult }) => {
        notifyProbeResult(url, itemCount);
      });
      await appendToContextBuffer('probe_executed', { url, items: itemCount, sentiment });
      return { success: true, timestamp: Date.now() };
    }

    // ─── Tasks ────────────────────────────────────────────────
    case 'TASK_COMPLETED': {
      const { text, quadrant } = message.payload as { text: string; quadrant: string };
      await appendToContextBuffer('task_completed', { text, quadrant });
      return { success: true, timestamp: Date.now() };
    }

    // ─── Context Buffer ───────────────────────────────────────
    case 'CONTEXT_BUFFER_GET': {
      const result = await chrome.storage.local.get('neo_context_buffer');
      return {
        success: true,
        data: result.neo_context_buffer || [],
        timestamp: Date.now(),
      };
    }

    case 'CONTEXT_BUFFER_CLEAR': {
      await chrome.storage.local.set({ neo_context_buffer: [] });
      return { success: true, timestamp: Date.now() };
    }

    // ─── Default ──────────────────────────────────────────────
    default:
      return {
        success: false,
        error: `Unknown message type: ${message.type}`,
        timestamp: Date.now(),
      };
  }
}

// ─── Alarm Handler ────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === METRICS_ALARM) {
    await pollSystemMetrics();
  } else {
    handleAlarms(alarm);
  }
});

// ─── System Metrics Polling ───────────────────────────────────────────────────

async function pollSystemMetrics(): Promise<void> {
  try {
    const raw = await sendNativeMessage({ action: 'system_metrics' }) as {
      type: string;
      data: Record<string, unknown>;
    };

    if (raw.type !== 'system_metrics') return;

    const metrics = raw.data;

    // Update bridge connected status
    await chrome.storage.local.set({ neo_bridge_connected: true });

    // Update rolling history (max 60 points ≈ 3 minutes at 3s interval)
    const histResult = await chrome.storage.local.get('neo_metrics_history');
    const history: unknown[] = histResult.neo_metrics_history || [];
    history.push({
      ts: Date.now(),
      cpu: metrics.cpu_percent,
      ram: metrics.memory_percent,
      disk: metrics.disk_percent,
    });
    if (history.length > 60) history.shift();

    // Handle Panic Mode
    const panicData = metrics.panic as {
      panic: boolean;
      level: string;
      reason: string;
      recovering: boolean;
    } | undefined;

    if (panicData) {
      const prevResult = await chrome.storage.local.get('neo_panic_state');
      const prevPanic = prevResult.neo_panic_state?.panic ?? false;

      await chrome.storage.local.set({ neo_panic_state: panicData });

      if (panicData.panic && !prevPanic) {
        // PANIC TRIGGERED → Switch to Punk Hazard theme
        const themeResult = await chrome.storage.local.get('neo_theme');
        await chrome.storage.local.set({
          neo_theme: 'punk-hazard',
          neo_theme_before_panic: themeResult.neo_theme || 'egghead',
        });
        showNotification(
          'neo-panic',
          '⚠️ Neo — Surcharge Système',
          `🔴 ${panicData.reason} — Fermeture des processus non essentiels recommandée.`,
          'high'
        );
        await appendToContextBuffer('panic_triggered', {
          cpu: metrics.cpu_percent,
          ram: metrics.memory_percent,
          level: panicData.level,
          reason: panicData.reason,
        });
      } else if (panicData.recovering && prevPanic) {
        // PANIC RECOVERY → Restore previous theme
        const savedResult = await chrome.storage.local.get('neo_theme_before_panic');
        const prevTheme = savedResult.neo_theme_before_panic || 'egghead';
        await chrome.storage.local.set({ neo_theme: prevTheme });
        showNotification(
          'neo-recovery',
          '✅ Neo — Système Stabilisé',
          `Le système est revenu à un état normal. Thème restauré.`,
          'normal'
        );
        await appendToContextBuffer('panic_recovered', {
          cpu: metrics.cpu_percent,
          ram: metrics.memory_percent,
        });
      }
    }

    // Persist metrics + history
    await chrome.storage.local.set({
      neo_system_metrics: metrics,
      neo_metrics_history: history,
    });

  } catch (error) {
    console.warn('[Neo SW] Metrics poll failed (bridge offline?):', error);
    await chrome.storage.local.set({ neo_bridge_connected: false });
  }
}

// ─── Native Messaging ─────────────────────────────────────────────────────────

function sendNativeMessage(payload: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendNativeMessage(
        NATIVE_HOST_NAME,
        payload as object,
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

// ─── Context Buffer ───────────────────────────────────────────────────────────

async function appendToContextBuffer(
  type: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const result = await chrome.storage.local.get('neo_context_buffer');
    const buffer: ContextEvent[] = result.neo_context_buffer || [];

    buffer.push({ ts: Date.now(), type, data });

    // Keep only the last BUFFER_MAX_SIZE entries (FIFO)
    if (buffer.length > BUFFER_MAX_SIZE) {
      buffer.splice(0, buffer.length - BUFFER_MAX_SIZE);
    }

    await chrome.storage.local.set({ neo_context_buffer: buffer });
  } catch (error) {
    console.warn('[Neo SW] appendToContextBuffer error:', error);
  }
}

// ─── Default Module Definitions ───────────────────────────────────────────────

function getDefaultModules() {
  return [
    {
      id: 'focus-timer',
      name: 'Focus Timer',
      description: 'Pomodoro avancé avec tracking du temps de concentration',
      icon: '⏱️',
      status: 'inactive',
      enabled: false,
      version: '0.2.0',
    },
    {
      id: 'system-monitor',
      name: 'System Monitor',
      description: 'Monitoring CPU, RAM, disque via le bridge Python',
      icon: '📊',
      status: 'inactive',
      enabled: false,
      version: '0.2.0',
    },
    {
      id: 'web-probes',
      name: 'Web Probes',
      description: 'Extraction de données web configurables',
      icon: '🕷️',
      status: 'inactive',
      enabled: false,
      version: '0.2.0',
    },
    {
      id: 'task-manager',
      name: 'Task Manager',
      description: 'Gestion de tâches avec matrice Eisenhower',
      icon: '📋',
      status: 'inactive',
      enabled: false,
      version: '0.2.0',
    },
    {
      id: 'kernel',
      name: 'Kernel Terminal',
      description: 'Terminal sandboxé pour diagnostics système',
      icon: '💻',
      status: 'inactive',
      enabled: false,
      version: '0.2.0',
    },
  ];
}

console.log('[Neo SW] 🧬 Service Worker v0.2.0 loaded.');
