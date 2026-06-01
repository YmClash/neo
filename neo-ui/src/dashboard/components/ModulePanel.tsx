import React from 'react';
import { motion } from 'framer-motion';
import { Card, Badge, Button } from '@shared/components';
import type { NeoModule, ModuleId } from '@shared/types';

// ─── Module Panel Component ───────────────────────────────────────────────────
// Detailed module configuration panel for the dashboard.

interface ModulePanelProps {
  modules: NeoModule[];
  onToggle: (id: ModuleId) => void;
}

export const ModulePanel: React.FC<ModulePanelProps> = ({ modules, onToggle }) => {
  return (
    <Card variant="glass" padding="none">
      <div className="divide-y divide-neo-border">
        {modules.map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 hover:bg-neo-bg-alt/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              {/* Module Icon */}
              <div
                className={`
                  w-10 h-10 rounded-neo flex items-center justify-center text-xl
                  ${
                    module.enabled
                      ? 'bg-neo-accent/10 border border-neo-accent/30'
                      : 'bg-neo-surface border border-neo-border'
                  }
                `}
              >
                {module.icon}
              </div>

              {/* Module Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neo-text">
                    {module.name}
                  </span>
                  <Badge
                    variant={module.enabled ? 'success' : 'default'}
                    dot
                    size="sm"
                  >
                    {module.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-neo-text-dim mt-0.5">
                  {module.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant={module.enabled ? 'danger' : 'primary'}
                  size="sm"
                  onClick={() => onToggle(module.id)}
                >
                  {module.enabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};
