// ─── Neo Module Manager ───────────────────────────────────────────────────────
// Manages the lifecycle of Neo modules from the service worker context.

interface NeoModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'active' | 'inactive' | 'error' | 'loading';
  enabled: boolean;
  version: string;
  config?: Record<string, unknown>;
}

/**
 * Module Manager — handles loading, enabling, and configuring modules
 * from the service worker (background) context.
 */
export class ModuleManager {
  /**
   * Get all registered modules from storage.
   */
  async getModules(): Promise<NeoModule[]> {
    const result = await chrome.storage.local.get('neo_modules');
    return result.neo_modules || [];
  }

  /**
   * Toggle a module on/off.
   */
  async toggleModule(moduleId: string, enabled: boolean): Promise<void> {
    const modules = await this.getModules();
    const updated = modules.map((m) => {
      if (m.id === moduleId) {
        return {
          ...m,
          enabled,
          status: enabled ? ('active' as const) : ('inactive' as const),
        };
      }
      return m;
    });

    await chrome.storage.local.set({ neo_modules: updated });

    if (enabled) {
      await this.onModuleActivated(moduleId);
    } else {
      await this.onModuleDeactivated(moduleId);
    }

    console.log(`[Neo ModuleManager] ${moduleId} → ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Update a module's configuration.
   */
  async updateConfig(moduleId: string, config: Record<string, unknown>): Promise<void> {
    const modules = await this.getModules();
    const updated = modules.map((m) => {
      if (m.id === moduleId) {
        return { ...m, config: { ...m.config, ...config } };
      }
      return m;
    });

    await chrome.storage.local.set({ neo_modules: updated });
    console.log(`[Neo ModuleManager] ${moduleId} config updated.`);
  }

  /**
   * Get a single module by ID.
   */
  async getModule(moduleId: string): Promise<NeoModule | undefined> {
    const modules = await this.getModules();
    return modules.find((m) => m.id === moduleId);
  }

  // ─── Module Lifecycle Hooks ───────────────────────────────────────────

  private async onModuleActivated(moduleId: string): Promise<void> {
    switch (moduleId) {
      case 'focus-timer':
        console.log('[Neo ModuleManager] ⏱️ Focus Timer activated.');
        // TODO: Phase 2 — Initialize focus timer state
        break;

      case 'system-monitor':
        console.log('[Neo ModuleManager] 📊 System Monitor activated.');
        // TODO: Phase 3 — Start native messaging polling
        break;

      case 'web-probes':
        console.log('[Neo ModuleManager] 🕷️ Web Probes activated.');
        // TODO: Phase 2 — Register content scripts
        break;

      case 'task-manager':
        console.log('[Neo ModuleManager] 📋 Task Manager activated.');
        // TODO: Phase 2 — Load tasks from storage
        break;

      case 'tech-watch':
        console.log('[Neo ModuleManager] 📰 Tech Watch activated.');
        // TODO: Phase 4 — Start periodic news fetching
        break;

      default:
        console.log(`[Neo ModuleManager] Unknown module activated: ${moduleId}`);
    }
  }

  private async onModuleDeactivated(moduleId: string): Promise<void> {
    switch (moduleId) {
      case 'focus-timer':
        // Clear any active focus alarms
        chrome.alarms.clear(`neo-focus-*`);
        break;

      case 'system-monitor':
        // Stop native messaging polling
        break;

      default:
        break;
    }
    console.log(`[Neo ModuleManager] ${moduleId} deactivated — cleanup done.`);
  }
}
