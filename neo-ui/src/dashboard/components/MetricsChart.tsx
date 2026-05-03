import React from 'react';
import { Card } from '@shared/components';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Metrics Chart Component ──────────────────────────────────────────────────
// Recharts-based time series visualization for monitoring data.

// Placeholder data for Phase 1
const PLACEHOLDER_DATA = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, '0')}:00`,
  focus: Math.floor(Math.random() * 60 + 20),
  tasks: Math.floor(Math.random() * 10),
  probes: Math.floor(Math.random() * 30 + 5),
}));

// Custom tooltip styling
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload) return null;

  return (
    <div className="neo-glass p-3 rounded-neo text-xs font-mono">
      <p className="text-neo-text-dim mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

export const MetricsChart: React.FC = () => {
  return (
    <Card variant="glass" padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-mono text-neo-text-dim tracking-wider">
          24H ACTIVITY
        </h3>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#6366f1]" /> Focus
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#34d399]" /> Tasks
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#fbbf24]" /> Probes
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={PLACEHOLDER_DATA}>
          <defs>
            <linearGradient id="gradFocus" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradTasks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradProbes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--neo-border)"
            opacity={0.3}
          />
          <XAxis
            dataKey="time"
            stroke="var(--neo-text-dim)"
            fontSize={10}
            tickLine={false}
          />
          <YAxis
            stroke="var(--neo-text-dim)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="focus"
            stroke="#6366f1"
            fill="url(#gradFocus)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="tasks"
            stroke="#34d399"
            fill="url(#gradTasks)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="probes"
            stroke="#fbbf24"
            fill="url(#gradProbes)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};
