// ─── Chrome Runtime Messaging Abstraction ─────────────────────────────────────
// Type-safe message passing between extension components.
import { createNeoMessage } from '@shared/types';
/**
 * Send a message to the service worker (background script).
 * @returns The typed response from the service worker
 */
export async function sendToBackground(type, payload) {
    const message = createNeoMessage(type, 'popup', payload);
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                resolve({
                    success: false,
                    error: chrome.runtime.lastError.message,
                    timestamp: Date.now(),
                });
            }
            else {
                resolve(response);
            }
        });
    });
}
/**
 * Send a message to a specific tab's content script.
 */
export async function sendToTab(tabId, type, payload) {
    const message = createNeoMessage(type, 'popup', payload);
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
                resolve({
                    success: false,
                    error: chrome.runtime.lastError.message,
                    timestamp: Date.now(),
                });
            }
            else {
                resolve(response);
            }
        });
    });
}
/**
 * Listen for incoming messages in any extension context.
 */
export function onMessage(handler) {
    chrome.runtime.onMessage.addListener(handler);
}
/**
 * Create a persistent connection (port) to the service worker.
 */
export function connectToBackground(name) {
    return chrome.runtime.connect({ name });
}
//# sourceMappingURL=messaging.js.map