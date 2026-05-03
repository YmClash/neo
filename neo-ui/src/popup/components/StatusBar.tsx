import React from 'react';
import { Badge } from '@shared/components';

// ─── Status Bar Component ─────────────────────────────────────────────────────
// Shows the current state of Neo's subsystems.

interface StatusBarProps {
  wasmReady: boolean;
  wasmLoading: boolean;
  activeCount: number;
  totalCount: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  wasmReady,
  wasmLoading,
  activeCount,
  totalCount,
}) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-neo-bg-alt border-b border-neo-border">
      {/* WASM Status */}
      <Badge
        variant={wasmReady ? 'success' : wasmLoading ? 'warning' : 'danger'}
        dot
        pulse={wasmLoading}
        size="sm"
      >
        WASM {wasmReady ? 'OK' : wasmLoading ? 'INIT' : 'OFF'}
      </Badge>

      {/* Modules Status */}
      <Badge variant={activeCount > 0 ? 'info' : 'default'} dot size="sm">
        {activeCount} MOD
      </Badge>

      {/* Spacer */}
      <div className="flex-1" />

      {/* System clock */}
      <span className="text-[9px] font-mono text-neo-text-dim">
        {new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
};
