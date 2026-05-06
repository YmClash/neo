import { NeoMessage, NeoResponse, NeoMessageType } from '@shared/types';
/**
 * Send a message to the service worker (background script).
 * @returns The typed response from the service worker
 */
export declare function sendToBackground<T = unknown>(type: NeoMessageType, payload?: unknown): Promise<NeoResponse<T>>;
/**
 * Send a message to a specific tab's content script.
 */
export declare function sendToTab<T = unknown>(tabId: number, type: NeoMessageType, payload?: unknown): Promise<NeoResponse<T>>;
/**
 * Listen for incoming messages in any extension context.
 */
export declare function onMessage(handler: (message: NeoMessage, sender: chrome.runtime.MessageSender, sendResponse: (response: NeoResponse) => void) => boolean | void): void;
/**
 * Create a persistent connection (port) to the service worker.
 */
export declare function connectToBackground(name: string): chrome.runtime.Port;
//# sourceMappingURL=messaging.d.ts.map