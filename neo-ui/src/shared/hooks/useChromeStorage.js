// ─── useChromeStorage Hook ────────────────────────────────────────────────────
// React hook for reactive Chrome storage access.
import { useState, useEffect, useCallback } from 'react';
import { storageGet, storageSet, onStorageChange } from '@shared/utils/storage';
/**
 * React hook for Chrome storage with reactive updates.
 * Automatically syncs state when storage changes (from other contexts).
 *
 * @param key — The storage key
 * @param defaultValue — Default value if key doesn't exist
 * @param area — 'local' or 'session'
 */
export function useChromeStorage(key, defaultValue, area = 'local') {
    const [value, setValue] = useState(defaultValue);
    const [loading, setLoading] = useState(true);
    // Load initial value
    useEffect(() => {
        storageGet(key, area).then((stored) => {
            if (stored !== undefined) {
                setValue(stored);
            }
            setLoading(false);
        });
    }, [key, area]);
    // Listen for changes from other contexts
    useEffect(() => {
        const handler = (changes, areaName) => {
            if (areaName === area && changes[key]) {
                setValue(changes[key].newValue);
            }
        };
        onStorageChange(handler);
        return () => {
            chrome.storage.onChanged.removeListener(handler);
        };
    }, [key, area]);
    // Update function (supports functional updates)
    const update = useCallback(async (newValue) => {
        const resolvedValue = typeof newValue === 'function'
            ? newValue(value)
            : newValue;
        setValue(resolvedValue);
        await storageSet(key, resolvedValue, area);
    }, [key, area, value]);
    return [value, update, loading];
}
//# sourceMappingURL=useChromeStorage.js.map