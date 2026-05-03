// ─── Chrome Extension Type Declarations ───────────────────────────────────────
// Augments @types/chrome with Neo-specific message types.

/** Neo-specific message types passed via chrome.runtime.sendMessage */
export interface NeoMessage {
  type: NeoMessageType;
  payload?: unknown;
  source: 'popup' | 'dashboard' | 'content-script' | 'service-worker';
  timestamp: number;
}

export type NeoMessageType =
  // Module management
  | 'NEO_INIT'
  | 'MODULE_TOGGLE'
  | 'MODULE_CONFIG'
  | 'MODULE_STATUS'
  | 'GET_MODULES'
  // Metrics
  | 'METRICS_PUSH'
  | 'METRICS_GET'
  | 'METRICS_SUMMARY'
  // Focus Timer
  | 'FOCUS_START'
  | 'FOCUS_PAUSE'
  | 'FOCUS_STOP'
  | 'FOCUS_STATUS'
  // Web Probes
  | 'PROBE_EXECUTE'
  | 'PROBE_RESULT'
  | 'PROBE_CONFIG'
  // System Bridge
  | 'BRIDGE_COMMAND'
  | 'BRIDGE_RESULT'
  | 'SYSTEM_METRICS'
  // Tasks
  | 'TASK_CREATE'
  | 'TASK_UPDATE'
  | 'TASK_DELETE'
  | 'TASK_LIST'
  // Theme
  | 'THEME_CHANGE'
  | 'THEME_GET';

/** Response wrapper for all Neo messages */
export interface NeoResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/** Helper to create a Neo message */
export function createNeoMessage(
  type: NeoMessageType,
  source: NeoMessage['source'],
  payload?: unknown
): NeoMessage {
  return {
    type,
    source,
    payload,
    timestamp: Date.now(),
  };
}
