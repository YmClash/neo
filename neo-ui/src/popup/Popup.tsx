import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, ThemeSwitcher } from '@shared/components';
import { useModules, useWasm } from '@shared/hooks';
import { ModuleToggle } from './components/ModuleToggle';
import { QuickStats } from './components/QuickStats';
import { StatusBar } from './components/StatusBar';

// ─── Neo Popup ────────────────────────────────────────────────────────────────
// The control panel that opens when clicking the extension icon.

export const Popup: React.FC = () => {
  const { modules, activeModules, toggleModule, loading: modulesLoading } = useModules();
  const { ready: wasmReady, loading: wasmLoading } = useWasm();

  // Apply stored theme on mount
  useEffect(() => {
    chrome.storage.local.get('neo_theme', (result) => {
      const theme = result.neo_theme || 'egghead';
      document.documentElement.setAttribute('data-theme', theme);
    });
  }, []);

  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dist/dashboard.html') });
  };

  return (
    <div className="min-h-[500px] bg-neo-bg flex flex-col">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <header className="relative px-4 pt-4 pb-3 border-b border-neo-border overflow-hidden">
        {/* Scan line effect */}
        <div className="absolute inset-0 neo-scanline opacity-20 pointer-events-none" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="text-2xl"
            >
              🧬
            </motion.div>
            <div>
              <h1 className="text-lg font-display font-bold neo-gradient-text">
                NEO
              </h1>
              <p className="text-[10px] font-mono text-neo-text-dim tracking-wider">
                ADVANCED MONITORING v0.1.0
              </p>
            </div>
          </div>
          <ThemeSwitcher compact />
        </div>
      </header>

      {/* ─── Status Bar ──────────────────────────────────────────── */}
      <StatusBar
        wasmReady={wasmReady}
        wasmLoading={wasmLoading}
        activeCount={activeModules.length}
        totalCount={modules.length}
      />

      {/* ─── Quick Stats ─────────────────────────────────────────── */}
      <div className="px-4 py-3">
        <QuickStats />
      </div>

      {/* ─── Modules ─────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-neo-text-dim tracking-wider">
            MODULES
          </span>
          <Badge variant="accent" size="sm">
            {activeModules.length}/{modules.length}
          </Badge>
        </div>

        <AnimatePresence>
          <div className="space-y-2">
            {modules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ModuleToggle
                  module={module}
                  onToggle={() => toggleModule(module.id)}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <footer className="px-4 py-3 border-t border-neo-border">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={openDashboard}
          className="w-full py-2.5 rounded-neo bg-neo-accent/10 text-neo-accent
                     border border-neo-accent/20 hover:border-neo-accent/50
                     font-mono text-xs tracking-wider
                     transition-all duration-200
                     hover:bg-neo-accent/20 hover:shadow-lg hover:shadow-neo-accent/10"
        >
          ◈ OPEN FULL DASHBOARD
        </motion.button>
      </footer>
    </div>
  );
};
