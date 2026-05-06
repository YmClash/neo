/** Neo-specific message types passed via chrome.runtime.sendMessage */
export interface NeoMessage {
    type: NeoMessageType;
    payload?: unknown;
    source: 'popup' | 'dashboard' | 'content-script' | 'service-worker';
    timestamp: number;
}
export type NeoMessageType = 'NEO_INIT' | 'MODULE_TOGGLE' | 'MODULE_CONFIG' | 'MODULE_STATUS' | 'GET_MODULES' | 'METRICS_PUSH' | 'METRICS_GET' | 'METRICS_SUMMARY' | 'FOCUS_START' | 'FOCUS_PAUSE' | 'FOCUS_STOP' | 'FOCUS_STATUS' | 'PROBE_EXECUTE' | 'PROBE_RESULT' | 'PROBE_CONFIG' | 'BRIDGE_COMMAND' | 'BRIDGE_RESULT' | 'SYSTEM_METRICS' | 'TASK_CREATE' | 'TASK_UPDATE' | 'TASK_DELETE' | 'TASK_LIST' | 'THEME_CHANGE' | 'THEME_GET';
/** Response wrapper for all Neo messages */
export interface NeoResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: number;
}
/** Helper to create a Neo message */
export declare function createNeoMessage(type: NeoMessageType, source: NeoMessage['source'], payload?: unknown): NeoMessage;
//# sourceMappingURL=chrome.d.ts.map