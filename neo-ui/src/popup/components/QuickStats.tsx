import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@shared/components';

// ─── Quick Stats Component ────────────────────────────────────────────────────
// Condensed statistics shown in the popup.

interface StatItem {
  label: string;
  value: string;
  icon: string;
  trend?: 'up' | 'down' | 'stable';
}

export const QuickStats: React.FC = () => {
  // TODO: Replace with real data from service worker
  const stats: StatItem[] = [
    { label: 'Focus', value: '—', icon: '⏱️', trend: 'stable' },
    { label: 'Tasks', value: '0', icon: '📋', trend: 'stable' },
    { label: 'Probes', value: '0', icon: '🕷️', trend: 'stable' },
  ];

  const trendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '—';
    }
  };

  const trendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-neo-success';
      case 'down': return 'text-neo-danger';
      default: return 'text-neo-text-dim';
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card variant="flat" padding="sm" className="text-center">
            <div className="text-lg mb-1">{stat.icon}</div>
            <div className="text-base font-bold font-mono text-neo-text">
              {stat.value}
            </div>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className="text-[9px] font-mono text-neo-text-dim uppercase tracking-wider">
                {stat.label}
              </span>
              {stat.trend && (
                <span className={`text-[9px] ${trendColor(stat.trend)}`}>
                  {trendIcon(stat.trend)}
                </span>
              )}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
