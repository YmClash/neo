import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge, ThemeSwitcher, FocusTimerWidget } from '@shared/components';
import { useModules, useWasm } from '@shared/hooks';
import { BrainOscilloscope } from './components/BrainOscilloscope';
import { ModulePanel } from './components/ModulePanel';
import { TaskBoard } from './components/TaskBoard';
import { WebProbeView } from './components/WebProbeView';
import { KernelTerminal } from './components/KernelTerminal';
import { ContextJournal } from './components/ContextJournal';
import { NeoConsole } from './components/NeoConsole';
import { NeoCodex } from './components/NeoCodex';

// ─── Neo Dashboard v0.2.0 ─────────────────────────────────────────────────────
// Full-screen monitoring and control interface.

export const Dashboard: React.FC = () => {
  const { modules, activeModules, toggleModule } = useModules();
  const { ready: wasmReady, wasm } = useWasm();
  const [bridgeConnected, setBridgeConnected] = useState(false);
  const [isPanic, setIsPanic] = useState(false);

  // Apply stored theme on mount + react to theme changes (including Panic Mode)
  useEffect(() => {
    const apply = (theme: string) => {
      document.documentElement.setAttribute('data-theme', theme);
    };

    chrome.storage.local.get(['neo_theme', 'neo_bridge_connected', 'neo_panic_state'], (result) => {
      apply(result.neo_theme || 'egghead');
      setBridgeConnected(result.neo_bridge_connected ?? false);
      setIsPanic(result.neo_panic_state?.panic ?? false);
    });

    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.neo_theme) apply(changes.neo_theme.newValue || 'egghead');
      if (changes.neo_bridge_connected) setBridgeConnected(changes.neo_bridge_connected.newValue ?? false);
      if (changes.neo_panic_state) setIsPanic(changes.neo_panic_state.newValue?.panic ?? false);
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return (
    <div className="min-h-screen bg-neo-bg neo-grid-bg">

      {/* ─── Top Navigation ──────────────────────────────────────── */}
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
              <h1 className="text-xl font-display font-bold neo-gradient-text">NEO DASHBOARD</h1>
              <p className="text-xs font-mono text-neo-text-dim tracking-widest">
                ADVANCED MONITORING &amp; CONTROL SYSTEM dev by YmC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* WASM Status */}
            <Badge variant={wasmReady ? 'success' : 'warning'} dot pulse={!wasmReady}>
              WASM {wasmReady ? 'ONLINE' : 'LOADING'}
            </Badge>

            {/* Bridge Status */}
            <Badge
              variant={isPanic ? 'danger' : bridgeConnected ? 'success' : 'warning'}
              dot
              pulse={isPanic}
            >
              {isPanic ? '⚠ PANIC' : bridgeConnected ? 'BRIDGE ON' : 'BRIDGE OFF'}
            </Badge>

            {/* Active Modules */}
            <Badge variant="info" dot>
              {activeModules.length} MODULES
            </Badge>

            {/* WASM Version */}
            {wasm && (
              <Badge variant="accent" size="sm">
                CORE v{wasm.version()}
              </Badge>
            )}

            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      {/* ─── Main Content ────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-6">

        {/* ─── Row 1: Brain Oscilloscope + Focus Timer ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <section className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-mono text-neo-text-dim tracking-widest">◈ SYSTEM MONITOR</span>
              <div className="flex-1 h-px bg-neo-border" />
            </div>
            <BrainOscilloscope />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-mono text-neo-text-dim tracking-widest">◈ FOCUS TIMER</span>
              <div className="flex-1 h-px bg-neo-border" />
            </div>
            <FocusTimerWidget />
          </section>
        </div>

        {/* ─── Row 2: Module Control + Task Board ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-mono text-neo-text-dim tracking-widest">◈ MODULE CONTROL</span>
              <div className="flex-1 h-px bg-neo-border" />
            </div>
            <ModulePanel modules={modules} onToggle={toggleModule} />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-mono text-neo-text-dim tracking-widest">◈ TASK BOARD</span>
              <div className="flex-1 h-px bg-neo-border" />
            </div>
            <TaskBoard />
          </section>
        </div>

        {/* ─── Row 3: Neo Console (full width) ────────────────── */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-mono text-neo-text-dim tracking-widest">◈ NEO CONSOLE — AI</span>
            <div className="flex-1 h-px bg-neo-border" />
          </div>
          <NeoConsole />
        </section>

        {/* ─── Row 4: Kernel Terminal + Context Journal ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-mono text-neo-text-dim tracking-widest">◈ KERNEL TERMINAL</span>
              <div className="flex-1 h-px bg-neo-border" />
            </div>
            <KernelTerminal />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-mono text-neo-text-dim tracking-widest">◈ CONTEXT JOURNAL</span>
              <div className="flex-1 h-px bg-neo-border" />
            </div>
            <ContextJournal />
          </section>
        </div>

        {/* ─── Row 5: Codex Sémantique + Web Probes ────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-mono text-neo-text-dim tracking-widest">◈ CODEX SÉMANTIQUE</span>
              <div className="flex-1 h-px bg-neo-border" />
            </div>
            <NeoCodex />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-mono text-neo-text-dim tracking-widest">◈ WEB PROBES</span>
              <div className="flex-1 h-px bg-neo-border" />
            </div>
            <WebProbeView />
          </section>
        </div>
      </main>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-neo-border py-4 mt-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <span className="text-[10px] font-mono text-neo-text-dim">
            NEO v0.3.0 — PHASE 5 — EGGHEAD LABORATORY
          </span>
          <span className="text-[10px] font-mono text-neo-text-dim">
            {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </footer>
    </div>
  );
};
