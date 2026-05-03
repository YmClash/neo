import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Badge, ThemeSwitcher } from '@shared/components';
import { useModules, useWasm } from '@shared/hooks';
import { MetricsChart } from './components/MetricsChart';
import { ModulePanel } from './components/ModulePanel';
import { TaskBoard } from './components/TaskBoard';
import { WebProbeView } from './components/WebProbeView';

// ─── Neo Dashboard ────────────────────────────────────────────────────────────
// Full-screen monitoring and control interface.

export const Dashboard: React.FC = () => {
  const { modules, activeModules, toggleModule } = useModules();
  const { ready: wasmReady, wasm } = useWasm();

  // Apply stored theme on mount
  useEffect(() => {
    chrome.storage.local.get('neo_theme', (result) => {
      const theme = result.neo_theme || 'egghead';
      document.documentElement.setAttribute('data-theme', theme);
    });
  }, []);

  return (
    <div className="min-h-screen bg-neo-bg neo-grid-bg">
      {/* ─── Top Navigation ────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 neo-glass border-b border-neo-border px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="text-3xl"
            >
              🧬
            </motion.div>
            <div>
              <h1 className="text-xl font-display font-bold neo-gradient-text">
                NEO DASHBOARD
              </h1>
              <p className="text-xs font-mono text-neo-text-dim tracking-widest">
                ADVANCED MONITORING & CONTROL SYSTEM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Indicators */}
            <div className="flex items-center gap-2">
              <Badge
                variant={wasmReady ? 'success' : 'warning'}
                dot
                pulse={!wasmReady}
              >
                WASM {wasmReady ? 'ONLINE' : 'LOADING'}
              </Badge>
              <Badge variant="info" dot>
                {activeModules.length} MODULES
              </Badge>
              {wasm && (
                <Badge variant="accent" size="sm">
                  CORE v{wasm.version()}
                </Badge>
              )}
            </div>
            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      {/* ─── Main Content ──────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* ─── Top Row: Metrics Overview ─────────────────────── */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-mono text-neo-text-dim tracking-widest">
              ◈ METRICS OVERVIEW
            </span>
            <div className="flex-1 h-px bg-neo-border" />
          </div>
          <MetricsChart />
        </section>

        {/* ─── Middle Row: Modules + Tasks ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-mono text-neo-text-dim tracking-widest">
                ◈ MODULE CONTROL
              </span>
              <div className="flex-1 h-px bg-neo-border" />
            </div>
            <ModulePanel
              modules={modules}
              onToggle={toggleModule}
            />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-mono text-neo-text-dim tracking-widest">
                ◈ TASK BOARD
              </span>
              <div className="flex-1 h-px bg-neo-border" />
            </div>
            <TaskBoard />
          </section>
        </div>

        {/* ─── Bottom Row: Web Probes ─────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-mono text-neo-text-dim tracking-widest">
              ◈ WEB PROBES
            </span>
            <div className="flex-1 h-px bg-neo-border" />
          </div>
          <WebProbeView />
        </section>
      </main>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-neo-border py-4 mt-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <span className="text-[10px] font-mono text-neo-text-dim">
            NEO v0.1.0 — EGGHEAD LABORATORY
          </span>
          <span className="text-[10px] font-mono text-neo-text-dim">
            {new Date().toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </footer>
    </div>
  );
};
