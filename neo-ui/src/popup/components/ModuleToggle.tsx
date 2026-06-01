import React from 'react';
import { motion } from 'framer-motion';
import type { NeoModule } from '@shared/types';

// ─── Module Toggle Component ──────────────────────────────────────────────────

interface ModuleToggleProps {
  module: NeoModule;
  onToggle: () => void;
}

export const ModuleToggle: React.FC<ModuleToggleProps> = ({ module, onToggle }) => {
  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-neo
        border transition-all duration-200 cursor-pointer
        ${
          module.enabled
            ? 'bg-neo-accent/5 border-neo-accent/30 hover:border-neo-accent/50'
            : 'bg-neo-surface/50 border-neo-border hover:border-neo-border'
        }
      `}
      onClick={onToggle}
      role="switch"
      aria-checked={module.enabled}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
    >
      {/* Icon */}
      <span className="text-xl flex-shrink-0">{module.icon}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              module.enabled ? 'text-neo-text' : 'text-neo-text-dim'
            }`}
          >
            {module.name}
          </span>
          <span className="text-[9px] font-mono text-neo-text-dim">
            v{module.version}
          </span>
        </div>
        <p className="text-[10px] text-neo-text-dim truncate mt-0.5">
          {module.description}
        </p>
      </div>

      {/* Toggle Switch */}
      <div
        className={`
          relative w-10 h-5 rounded-full transition-colors duration-200
          ${module.enabled ? 'bg-neo-accent' : 'bg-neo-border'}
        `}
      >
        <motion.div
          animate={{ x: module.enabled ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`
            absolute top-0.5 w-4 h-4 rounded-full
            ${module.enabled ? 'bg-white shadow-lg' : 'bg-neo-text-dim'}
          `}
        />
        {module.enabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: '0 0 8px var(--neo-glow)',
            }}
          />
        )}
      </div>
    </div>
  );
};
