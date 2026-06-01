// ─── Chrome Runtime Messaging Abstraction ─────────────────────────────────────
// Type-safe message passing between extension components.

import { NeoMessage, NeoResponse, NeoMessageType, createNeoMessage } from '@shared/types';

/**
 * Send a message to the service worker (background script).
 * @returns The typed response from the service worker
 */
export async function sendToBackground<T = unknown>(
  type: NeoMessageType,
  payload?: unknown
): Promise<NeoResponse<T>> {
  const message = createNeoMessage(type, 'popup', payload);

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: NeoResponse<T>) => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message,
          timestamp: Date.now(),
        });
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Send a message to a specific tab's content script.
 */
export async function sendToTab<T = unknown>(
  tabId: number,
  type: NeoMessageType,
  payload?: unknown
): Promise<NeoResponse<T>> {
  const message = createNeoMessage(type, 'popup', payload);

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response: NeoResponse<T>) => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message,
          timestamp: Date.now(),
        });
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Listen for incoming messages in any extension context.
 */
export function onMessage(
  handler: (
    message: NeoMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: NeoResponse) => void
  ) => boolean | void
): void {
  chrome.runtime.onMessage.addListener(handler);
}

/**
 * Create a persistent connection (port) to the service worker.
 */
export function connectToBackground(name: string): chrome.runtime.Port {
  return chrome.runtime.connect({ name });
}
