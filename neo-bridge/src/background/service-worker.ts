// ═══════════════════════════════════════════════════════════════════════════════
// Neo Service Worker — The Central Brain
// ═══════════════════════════════════════════════════════════════════════════════
// Manages: module lifecycle, message routing, WASM bridge, alarms, notifications.
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

// ─── Module Manager Instance ──────────────────────────────────────────────────

const moduleManager = new ModuleManager();

// ─── Lifecycle Events ─────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Neo SW] 🧬 Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // First install — initialize default state
    await chrome.storage.local.set({
      neo_theme: 'egghead',
      neo_modules: getDefaultModules(),
      neo_tasks: [],
      neo_settings: {
        notifications: true,
        autoStart: false,
      },
    });

    // Show welcome notification
    showNotification(
      'neo-welcome',
      'Neo — Online',
      '🧬 Systèmes initialisés. Extension prête.',
      'normal'
    );

    console.log('[Neo SW] Default state initialized.');
  }

  // Register alarms
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

    // Handle async responses
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

    // Return true to indicate async response
    return true;
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
          version: '0.1.0',
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
      return {
        success: true,
        data: { moduleId, enabled },
        timestamp: Date.now(),
      };
    }

    case 'MODULE_CONFIG': {
      const { moduleId: configModuleId, config } = message.payload as {
        moduleId: string;
        config: Record<string, unknown>;
      };
      await moduleManager.updateConfig(configModuleId, config);
      return {
        success: true,
        data: { moduleId: configModuleId },
        timestamp: Date.now(),
      };
    }

    // ─── Theme ────────────────────────────────────────────────
    case 'THEME_CHANGE': {
      const { theme } = message.payload as { theme: string };
      await chrome.storage.local.set({ neo_theme: theme });
      return {
        success: true,
        data: { theme },
        timestamp: Date.now(),
      };
    }

    case 'THEME_GET': {
      const result = await chrome.storage.local.get('neo_theme');
      return {
        success: true,
        data: { theme: result.neo_theme || 'egghead' },
        timestamp: Date.now(),
      };
    }

    // ─── Bridge (Native Messaging) ────────────────────────────
    case 'BRIDGE_COMMAND': {
      try {
        const response = await sendNativeMessage(message.payload);
        return {
          success: true,
          data: response,
          timestamp: Date.now(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Bridge error',
          timestamp: Date.now(),
        };
      }
    }

    // ─── Focus Timer ──────────────────────────────────────────
    case 'FOCUS_START': {
      const { minutes } = message.payload as { minutes: number };
      const sessionId = Date.now().toString(); // Use timestamp as session ID
      import('./alarms').then(({ createFocusAlarm }) => {
        createFocusAlarm(sessionId, minutes);
      });
      return {
        success: true,
        data: { sessionId, minutes },
        timestamp: Date.now(),
      };
    }

    case 'FOCUS_STOP': {
      // Clear all focus alarms
      chrome.alarms.getAll((alarms) => {
        alarms.forEach(alarm => {
          if (alarm.name.startsWith('neo-focus-')) {
            chrome.alarms.clear(alarm.name);
          }
        });
      });
      return {
        success: true,
        timestamp: Date.now(),
      };
    }

    // ─── Web Probes ───────────────────────────────────────────
    case 'PROBE_COMPLETE': {
      const { url, itemCount } = message.payload as { url: string, itemCount: number };
      import('./notifications').then(({ notifyProbeResult }) => {
        notifyProbeResult(url, itemCount);
      });
      return {
        success: true,
        timestamp: Date.now(),
      };
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

chrome.alarms.onAlarm.addListener(handleAlarms);

// ─── Native Messaging ─────────────────────────────────────────────────────────

const NATIVE_HOST_NAME = 'com.neo.bridge';

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
      version: '0.1.0',
    },
    {
      id: 'system-monitor',
      name: 'System Monitor',
      description: 'Monitoring CPU, RAM, disque via le bridge Python',
      icon: '📊',
      status: 'inactive',
      enabled: false,
      version: '0.1.0',
    },
    {
      id: 'web-probes',
      name: 'Web Probes',
      description: 'Extraction de données web configurables',
      icon: '🕷️',
      status: 'inactive',
      enabled: false,
      version: '0.1.0',
    },
    {
      id: 'task-manager',
      name: 'Task Manager',
      description: 'Gestion de tâches avec matrice Eisenhower',
      icon: '📋',
      status: 'inactive',
      enabled: false,
      version: '0.1.0',
    },
    {
      id: 'tech-watch',
      name: 'Tech Watch',
      description: 'Veille IA, Rust & cybersécurité',
      icon: '📰',
      status: 'inactive',
      enabled: false,
      version: '0.1.0',
    },
  ];
}

console.log('[Neo SW] 🧬 Service Worker loaded.');
