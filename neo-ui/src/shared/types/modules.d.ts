/** Unique identifier for each Neo module */
export type ModuleId = 'focus-timer' | 'system-monitor' | 'web-probes' | 'task-manager' | 'tech-watch';
/** Status of a module */
export type ModuleStatus = 'active' | 'inactive' | 'error' | 'loading';
/** Configuration for a single Neo module */
export interface NeoModule {
    id: ModuleId;
    name: string;
    description: string;
    icon: string;
    status: ModuleStatus;
    enabled: boolean;
    version: string;
    config?: Record<string, unknown>;
}
/** Registry of all available modules */
export interface ModuleRegistry {
    modules: NeoModule[];
    lastUpdated: number;
}
/** Message sent between extension components about module state */
export interface ModuleMessage {
    type: 'MODULE_TOGGLE' | 'MODULE_CONFIG' | 'MODULE_STATUS';
    moduleId: ModuleId;
    payload?: unknown;
}
/** Default module definitions */
export declare const DEFAULT_MODULES: NeoModule[];
//# sourceMappingURL=modules.d.ts.map