// ─── Chrome Storage Abstraction ───────────────────────────────────────────────
// Typed wrappers around chrome.storage.local and chrome.storage.session.
/**
 * Get a value from Chrome storage.
 * @param key — The storage key
 * @param area — 'local' (persistent) or 'session' (volatile)
 */
export async function storageGet(key, area = 'local') {
    return new Promise((resolve) => {
        const storage = area === 'local' ? chrome.storage.local : chrome.storage.session;
        storage.get(key, (result) => {
            resolve(result[key]);
        });
    });
}
/**
 * Set a value in Chrome storage.
 * @param key — The storage key
 * @param value — The value to store
 * @param area — 'local' (persistent) or 'session' (volatile)
 */
export async function storageSet(key, value, area = 'local') {
    return new Promise((resolve) => {
        const storage = area === 'local' ? chrome.storage.local : chrome.storage.session;
        storage.set({ [key]: value }, () => resolve());
    });
}
/**
 * Remove a key from Chrome storage.
 */
export async function storageRemove(key, area = 'local') {
    return new Promise((resolve) => {
        const storage = area === 'local' ? chrome.storage.local : chrome.storage.session;
        storage.remove(key, () => resolve());
    });
}
/**
 * Get all keys from Chrome storage.
 */
export async function storageGetAll(area = 'local') {
    return new Promise((resolve) => {
        const storage = area === 'local' ? chrome.storage.local : chrome.storage.session;
        storage.get(null, (result) => resolve(result));
    });
}
/**
 * Listen for storage changes.
 */
export function onStorageChange(callback) {
    chrome.storage.onChanged.addListener(callback);
}
// ─── Storage Keys Constants ───────────────────────────────────────────────────
export const STORAGE_KEYS = {
    MODULES: 'neo_modules',
    THEME: 'neo_theme',
    FOCUS_SESSIONS: 'neo_focus_sessions',
    TASKS: 'neo_tasks',
    PROBES: 'neo_probes',
    SETTINGS: 'neo_settings',
    METRICS_CACHE: 'neo_metrics_cache',
};
//# sourceMappingURL=storage.js.map