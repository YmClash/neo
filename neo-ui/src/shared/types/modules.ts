// ─── Neo Module Types ─────────────────────────────────────────────────────────
// Defines the module system that allows enabling/disabling features.

/** Unique identifier for each Neo module */
export type ModuleId =
  | 'focus-timer'
  | 'system-monitor'
  | 'web-probes'
  | 'task-manager'
  | 'tech-watch';

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
export const DEFAULT_MODULES: NeoModule[] = [
  {
    id: 'focus-timer',
    name: 'Focus Timer',
    description: 'Pomodoro avancé avec tracking du temps de concentration',
    icon: '⏱️',
    status: 'inactive',
    enabled: false,
    version: '0.1.0',
  },
  {
    id: 'system-monitor',
    name: 'System Monitor',
    description: 'Monitoring CPU, RAM, disque via le bridge Python',
    icon: '📊',
    status: 'inactive',
    enabled: false,
    version: '0.1.0',
  },
  {
    id: 'web-probes',
    name: 'Web Probes',
    description: 'Extraction de données web configurables',
    icon: '🕷️',
    status: 'inactive',
    enabled: false,
    version: '0.1.0',
  },
  {
    id: 'task-manager',
    name: 'Task Manager',
    description: 'Gestion de tâches avec matrice Eisenhower',
    icon: '📋',
    status: 'inactive',
    enabled: false,
    version: '0.1.0',
  },
  {
    id: 'tech-watch',
    name: 'Tech Watch',
    description: 'Veille IA, Rust & cybersécurité',
    icon: '📰',
    status: 'inactive',
    enabled: false,
    version: '0.1.0',
  },
];
