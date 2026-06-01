// ─── useModules Hook ──────────────────────────────────────────────────────────
// React hook for managing Neo's modular system.

import { useCallback } from 'react';
import { useChromeStorage } from './useChromeStorage';
import { STORAGE_KEYS } from '@shared/utils/storage';
import { sendToBackground } from '@shared/utils/messaging';
import type { NeoModule, ModuleId } from '@shared/types';
import { DEFAULT_MODULES } from '@shared/types/modules';

interface UseModulesResult {
  /** List of all modules */
  modules: NeoModule[];
  /** Whether modules are loading from storage */
  loading: boolean;
  /** Toggle a module on/off */
  toggleModule: (id: ModuleId) => Promise<void>;
  /** Update a module's config */
  updateModuleConfig: (id: ModuleId, config: Record<string, unknown>) => Promise<void>;
  /** Get a specific module */
  getModule: (id: ModuleId) => NeoModule | undefined;
  /** Get only active modules */
  activeModules: NeoModule[];
}

/**
 * React hook for the Neo module system.
 * Persists module state in chrome.storage and syncs with the service worker.
 */
export function useModules(): UseModulesResult {
  const [modules, setModules, loading] = useChromeStorage<NeoModule[]>(
    STORAGE_KEYS.MODULES,
    DEFAULT_MODULES
  );

  const toggleModule = useCallback(
    async (id: ModuleId) => {
      const updated = modules.map((m) =>
        m.id === id
          ? {
              ...m,
              enabled: !m.enabled,
              status: !m.enabled ? ('active' as const) : ('inactive' as const),
            }
          : m
      );
      await setModules(updated);

      // Notify the service worker
      await sendToBackground('MODULE_TOGGLE', {
        moduleId: id,
        enabled: !modules.find((m) => m.id === id)?.enabled,
      });
    },
    [modules, setModules]
  );

  const updateModuleConfig = useCallback(
    async (id: ModuleId, config: Record<string, unknown>) => {
      const updated = modules.map((m) =>
        m.id === id ? { ...m, config: { ...m.config, ...config } } : m
      );
      await setModules(updated);

      await sendToBackground('MODULE_CONFIG', { moduleId: id, config });
    },
    [modules, setModules]
  );

  const getModule = useCallback(
    (id: ModuleId) => modules.find((m) => m.id === id),
    [modules]
  );

  const activeModules = modules.filter((m) => m.enabled);

  return {
    modules,
    loading,
    toggleModule,
    updateModuleConfig,
    getModule,
    activeModules,
  };
}
