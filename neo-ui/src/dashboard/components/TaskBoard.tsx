import React from 'react';
import { Card, Badge } from '@shared/components';

// ─── Task Board Component ─────────────────────────────────────────────────────
// Eisenhower matrix task management — Phase 1 skeleton.

interface TaskColumn {
  id: string;
  title: string;
  icon: string;
  color: string;
  tasks: string[];
}

const COLUMNS: TaskColumn[] = [
  {
    id: 'urgent-important',
    title: 'Urgent & Important',
    icon: '🔴',
    color: 'neo-danger',
    tasks: [],
  },
  {
    id: 'important',
    title: 'Important',
    icon: '🟠',
    color: 'neo-warning',
    tasks: [],
  },
  {
    id: 'urgent',
    title: 'Urgent',
    icon: '🟡',
    color: 'neo-info',
    tasks: [],
  },
  {
    id: 'delegate',
    title: 'Delegate',
    icon: '🟢',
    color: 'neo-success',
    tasks: [],
  },
];

export const TaskBoard: React.FC = () => {
  return (
    <Card variant="glass" padding="md">
      <div className="grid grid-cols-2 gap-3">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="bg-neo-bg-alt/50 rounded-neo p-3 border border-neo-border min-h-[120px]"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">{col.icon}</span>
              <span className="text-[10px] font-mono text-neo-text-dim tracking-wider uppercase">
                {col.title}
              </span>
              <Badge variant="default" size="sm">
                {col.tasks.length}
              </Badge>
            </div>

            {col.tasks.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-[10px] font-mono text-neo-text-dim opacity-50">
                  No tasks yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {col.tasks.map((task, i) => (
                  <div
                    key={i}
                    className="bg-neo-surface p-2 rounded text-xs text-neo-text border border-neo-border"
                  >
                    {task}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 text-center">
        <p className="text-[9px] font-mono text-neo-text-dim opacity-50">
          Task Manager module — Enable to start organizing
        </p>
      </div>
    </Card>
  );
};
