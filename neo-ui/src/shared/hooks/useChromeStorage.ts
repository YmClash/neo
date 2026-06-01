// ─── useChromeStorage Hook ────────────────────────────────────────────────────
// React hook for reactive Chrome storage access.

import { useState, useEffect, useCallback } from 'react';
import { storageGet, storageSet, onStorageChange } from '@shared/utils/storage';

type StorageArea = 'local' | 'session';

/**
 * React hook for Chrome storage with reactive updates.
 * Automatically syncs state when storage changes (from other contexts).
 *
 * @param key — The storage key
 * @param defaultValue — Default value if key doesn't exist
 * @param area — 'local' or 'session'
 */
export function useChromeStorage<T>(
  key: string,
  defaultValue: T,
  area: StorageArea = 'local'
): [T, (value: T | ((prev: T) => T)) => Promise<void>, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  // Load initial value
  useEffect(() => {
    storageGet<T>(key, area).then((stored) => {
      if (stored !== undefined) {
        setValue(stored);
      }
      setLoading(false);
    });
  }, [key, area]);

  // Listen for changes from other contexts
  useEffect(() => {
    const handler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === area && changes[key]) {
        setValue(changes[key].newValue as T);
      }
    };

    onStorageChange(handler);

    return () => {
      chrome.storage.onChanged.removeListener(handler);
    };
  }, [key, area]);

  // Update function (supports functional updates)
  const update = useCallback(
    async (newValue: T | ((prev: T) => T)) => {
      const resolvedValue =
        typeof newValue === 'function'
          ? (newValue as (prev: T) => T)(value)
          : newValue;

      setValue(resolvedValue);
      await storageSet(key, resolvedValue, area);
    },
    [key, area, value]
  );

  return [value, update, loading];
}
