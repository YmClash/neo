// ─── Neo Module Types ─────────────────────────────────────────────────────────
// Defines the module system that allows enabling/disabling features.
/** Default module definitions */
export const DEFAULT_MODULES = [
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
//# sourceMappingURL=modules.js.map