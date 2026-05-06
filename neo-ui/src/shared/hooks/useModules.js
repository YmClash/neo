// ─── useModules Hook ──────────────────────────────────────────────────────────
// React hook for managing Neo's modular system.
import { useCallback } from 'react';
import { useChromeStorage } from './useChromeStorage';
import { STORAGE_KEYS } from '@shared/utils/storage';
import { sendToBackground } from '@shared/utils/messaging';
import { DEFAULT_MODULES } from '@shared/types/modules';
/**
 * React hook for the Neo module system.
 * Persists module state in chrome.storage and syncs with the service worker.
 */
export function useModules() {
    const [modules, setModules, loading] = useChromeStorage(STORAGE_KEYS.MODULES, DEFAULT_MODULES);
    const toggleModule = useCallback(async (id) => {
        const updated = modules.map((m) => m.id === id
            ? {
                ...m,
                enabled: !m.enabled,
                status: !m.enabled ? 'active' : 'inactive',
            }
            : m);
        await setModules(updated);
        // Notify the service worker
        await sendToBackground('MODULE_TOGGLE', {
            moduleId: id,
            enabled: !modules.find((m) => m.id === id)?.enabled,
        });
    }, [modules, setModules]);
    const updateModuleConfig = useCallback(async (id, config) => {
        const updated = modules.map((m) => m.id === id ? { ...m, config: { ...m.config, ...config } } : m);
        await setModules(updated);
        await sendToBackground('MODULE_CONFIG', { moduleId: id, config });
    }, [modules, setModules]);
    const getModule = useCallback((id) => modules.find((m) => m.id === id), [modules]);
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
//# sourceMappingURL=useModules.js.map