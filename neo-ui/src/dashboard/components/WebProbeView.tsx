import React from 'react';
import { Card, Badge } from '@shared/components';

// ─── Web Probe View Component ─────────────────────────────────────────────────
// Displays web probe extraction results — Phase 1 skeleton.

export const WebProbeView: React.FC = () => {
  return (
    <Card variant="glass" padding="md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🕷️</span>
          <h3 className="text-sm font-mono text-neo-text-dim tracking-wider">
            ACTIVE PROBES
          </h3>
        </div>
        <Badge variant="default" size="sm">
          0 running
        </Badge>
      </div>

      {/* Empty State */}
      <div className="neo-grid-bg rounded-neo border border-neo-border p-8 text-center">
        <div className="text-4xl mb-3 opacity-30">🕸️</div>
        <p className="text-sm text-neo-text-dim mb-1">No active probes</p>
        <p className="text-[10px] font-mono text-neo-text-dim opacity-60">
          Enable the Web Probes module to start extracting data from web pages
        </p>
      </div>

      {/* Probe Table Header (for when probes are active) */}
      <div className="mt-4 overflow-hidden rounded-neo border border-neo-border">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="bg-neo-bg-alt border-b border-neo-border">
              <th className="text-left px-3 py-2 text-neo-text-dim font-medium">
                URL
              </th>
              <th className="text-left px-3 py-2 text-neo-text-dim font-medium">
                Status
              </th>
              <th className="text-left px-3 py-2 text-neo-text-dim font-medium">
                Last Run
              </th>
              <th className="text-left px-3 py-2 text-neo-text-dim font-medium">
                Items
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={4}
                className="px-3 py-4 text-center text-neo-text-dim opacity-50"
              >
                — awaiting probe configuration —
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
};
