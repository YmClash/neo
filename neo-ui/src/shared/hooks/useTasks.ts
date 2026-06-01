import { useState, useEffect } from 'react';

export type TaskCategory = 'urgent-important' | 'important' | 'urgent' | 'delegate';

export interface NeoTask {
  id: string;
  content: string;
  category: TaskCategory;
  completed: boolean;
  timestamp: number;
}

export function useTasks() {
  const [tasks, setTasks] = useState<NeoTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial tasks
  useEffect(() => {
    chrome.storage.local.get('neo_tasks', (result) => {
      if (result.neo_tasks) {
        setTasks(result.neo_tasks);
      }
      setLoading(false);
    });

    // Listen for cross-tab or background changes
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.neo_tasks) {
        setTasks(changes.neo_tasks.newValue || []);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const addTask = async (content: string, category: TaskCategory) => {
    if (!content.trim()) return;
    
    const newTask: NeoTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: content.trim(),
      category,
      completed: false,
      timestamp: Date.now(),
    };

    const newTasks = [...tasks, newTask];
    await chrome.storage.local.set({ neo_tasks: newTasks });
    setTasks(newTasks); // Optimistic UI update
  };

  const toggleTask = async (taskId: string) => {
    const newTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    await chrome.storage.local.set({ neo_tasks: newTasks });
    setTasks(newTasks);
  };

  const deleteTask = async (taskId: string) => {
    const newTasks = tasks.filter(task => task.id !== taskId);
    await chrome.storage.local.set({ neo_tasks: newTasks });
    setTasks(newTasks);
  };

  const clearCompleted = async () => {
    const newTasks = tasks.filter(task => !task.completed);
    await chrome.storage.local.set({ neo_tasks: newTasks });
    setTasks(newTasks);
  };

  // Group tasks by category
  const groupedTasks: Record<TaskCategory, NeoTask[]> = {
    'urgent-important': tasks.filter(t => t.category === 'urgent-important'),
    'important': tasks.filter(t => t.category === 'important'),
    'urgent': tasks.filter(t => t.category === 'urgent'),
    'delegate': tasks.filter(t => t.category === 'delegate'),
  };

  return {
    tasks,
    groupedTasks,
    loading,
    addTask,
    toggleTask,
    deleteTask,
    clearCompleted,
  };
}
