import React, { useState } from 'react';
import { Card, Badge, Button } from '@shared/components';
import { useTasks, TaskCategory, NeoTask } from '@shared/hooks';
import { motion, AnimatePresence } from 'framer-motion';

const COLUMNS: { id: TaskCategory; title: string; icon: string; color: string }[] = [
  { id: 'urgent-important', title: 'Urgent & Important', icon: '🔴', color: 'neo-danger' },
  { id: 'important', title: 'Important', icon: '🟠', color: 'neo-warning' },
  { id: 'urgent', title: 'Urgent', icon: '🟡', color: 'neo-info' },
  { id: 'delegate', title: 'Delegate', icon: '🟢', color: 'neo-success' },
];

export const TaskBoard: React.FC = () => {
  const { groupedTasks, loading, addTask, toggleTask, deleteTask, clearCompleted } = useTasks();
  const [newTaskContent, setNewTaskContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('urgent-important');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskContent.trim()) {
      addTask(newTaskContent, selectedCategory);
      setNewTaskContent('');
    }
  };

  if (loading) {
    return (
      <Card variant="glass" padding="md" className="flex items-center justify-center min-h-[300px]">
        <div className="text-neo-text-dim font-mono text-xs animate-pulse">LOADING TASKS...</div>
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="md" className="flex flex-col gap-4">
      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="flex gap-2">
        <input
          type="text"
          value={newTaskContent}
          onChange={(e) => setNewTaskContent(e.target.value)}
          placeholder="New task..."
          className="flex-1 bg-neo-bg-alt border border-neo-border rounded-neo px-3 py-2 text-sm text-neo-text focus:outline-none focus:border-neo-accent"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as TaskCategory)}
          className="bg-neo-bg-alt border border-neo-border rounded-neo px-2 py-2 text-xs text-neo-text-dim focus:outline-none"
        >
          {COLUMNS.map(col => (
            <option key={col.id} value={col.id}>{col.icon} {col.title}</option>
          ))}
        </select>
        <Button type="submit" variant="primary" size="sm">Add</Button>
      </form>

      {/* Eisenhower Matrix */}
      <div className="grid grid-cols-2 gap-3">
        {COLUMNS.map((col) => {
          const columnTasks = groupedTasks[col.id as TaskCategory] || [];
          return (
            <div
              key={col.id}
              className="bg-neo-bg-alt/50 rounded-neo p-3 border border-neo-border min-h-[120px] flex flex-col"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">{col.icon}</span>
                <span className="text-[10px] font-mono text-neo-text-dim tracking-wider uppercase flex-1">
                  {col.title}
                </span>
                <Badge variant="default" size="sm">
                  {columnTasks.length}
                </Badge>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto max-h-[150px] pr-1 custom-scrollbar">
                <AnimatePresence>
                  {columnTasks.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                      <p className="text-[10px] font-mono text-neo-text-dim opacity-50">Empty</p>
                    </motion.div>
                  ) : (
                    columnTasks.map((task: NeoTask) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`group flex items-start gap-2 bg-neo-surface p-2 rounded border transition-colors ${
                          task.completed ? 'border-neo-success/30 bg-neo-success/5' : 'border-neo-border'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                          className="mt-1 cursor-pointer accent-neo-accent"
                        />
                        <span className={`flex-1 text-xs break-words ${task.completed ? 'line-through text-neo-text-dim opacity-50' : 'text-neo-text'}`}>
                          {task.content}
                        </span>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-[10px] text-neo-danger hover:underline transition-opacity"
                        >
                          ✕
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center mt-2 border-t border-neo-border pt-3">
        <span className="text-[10px] font-mono text-neo-text-dim">
          EISENHOWER MATRIX
        </span>
        <Button variant="outline" size="sm" onClick={clearCompleted}>
          Clear Completed
        </Button>
      </div>
    </Card>
  );
};
