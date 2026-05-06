import type { NeoModule, ModuleId } from '@shared/types';
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
export declare function useModules(): UseModulesResult;
export {};
//# sourceMappingURL=useModules.d.ts.map