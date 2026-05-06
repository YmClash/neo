type StorageArea = 'local' | 'session';
/**
 * Get a value from Chrome storage.
 * @param key — The storage key
 * @param area — 'local' (persistent) or 'session' (volatile)
 */
export declare function storageGet<T>(key: string, area?: StorageArea): Promise<T | undefined>;
/**
 * Set a value in Chrome storage.
 * @param key — The storage key
 * @param value — The value to store
 * @param area — 'local' (persistent) or 'session' (volatile)
 */
export declare function storageSet<T>(key: string, value: T, area?: StorageArea): Promise<void>;
/**
 * Remove a key from Chrome storage.
 */
export declare function storageRemove(key: string, area?: StorageArea): Promise<void>;
/**
 * Get all keys from Chrome storage.
 */
export declare function storageGetAll(area?: StorageArea): Promise<Record<string, unknown>>;
/**
 * Listen for storage changes.
 */
export declare function onStorageChange(callback: (changes: {
    [key: string]: chrome.storage.StorageChange;
}, area: string) => void): void;
export declare const STORAGE_KEYS: {
    readonly MODULES: "neo_modules";
    readonly THEME: "neo_theme";
    readonly FOCUS_SESSIONS: "neo_focus_sessions";
    readonly TASKS: "neo_tasks";
    readonly PROBES: "neo_probes";
    readonly SETTINGS: "neo_settings";
    readonly METRICS_CACHE: "neo_metrics_cache";
};
export {};
//# sourceMappingURL=storage.d.ts.map