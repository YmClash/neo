type StorageArea = 'local' | 'session';
/**
 * React hook for Chrome storage with reactive updates.
 * Automatically syncs state when storage changes (from other contexts).
 *
 * @param key — The storage key
 * @param defaultValue — Default value if key doesn't exist
 * @param area — 'local' or 'session'
 */
export declare function useChromeStorage<T>(key: string, defaultValue: T, area?: StorageArea): [T, (value: T | ((prev: T) => T)) => Promise<void>, boolean];
export {};
//# sourceMappingURL=useChromeStorage.d.ts.map