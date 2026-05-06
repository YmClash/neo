import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, Badge, Button } from '@shared/components';
import { useTasks } from '@shared/hooks';
import { motion, AnimatePresence } from 'framer-motion';
const COLUMNS = [
    { id: 'urgent-important', title: 'Urgent & Important', icon: '🔴', color: 'neo-danger' },
    { id: 'important', title: 'Important', icon: '🟠', color: 'neo-warning' },
    { id: 'urgent', title: 'Urgent', icon: '🟡', color: 'neo-info' },
    { id: 'delegate', title: 'Delegate', icon: '🟢', color: 'neo-success' },
];
export const TaskBoard = () => {
    const { groupedTasks, loading, addTask, toggleTask, deleteTask, clearCompleted } = useTasks();
    const [newTaskContent, setNewTaskContent] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('urgent-important');
    const handleAddTask = (e) => {
        e.preventDefault();
        if (newTaskContent.trim()) {
            addTask(newTaskContent, selectedCategory);
            setNewTaskContent('');
        }
    };
    if (loading) {
        return (_jsx(Card, { variant: "glass", padding: "md", className: "flex items-center justify-center min-h-[300px]", children: _jsx("div", { className: "text-neo-text-dim font-mono text-xs animate-pulse", children: "LOADING TASKS..." }) }));
    }
    return (_jsxs(Card, { variant: "glass", padding: "md", className: "flex flex-col gap-4", children: [_jsxs("form", { onSubmit: handleAddTask, className: "flex gap-2", children: [_jsx("input", { type: "text", value: newTaskContent, onChange: (e) => setNewTaskContent(e.target.value), placeholder: "New task...", className: "flex-1 bg-neo-bg-alt border border-neo-border rounded-neo px-3 py-2 text-sm text-neo-text focus:outline-none focus:border-neo-accent" }), _jsx("select", { value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), className: "bg-neo-bg-alt border border-neo-border rounded-neo px-2 py-2 text-xs text-neo-text-dim focus:outline-none", children: COLUMNS.map(col => (_jsxs("option", { value: col.id, children: [col.icon, " ", col.title] }, col.id))) }), _jsx(Button, { type: "submit", variant: "primary", size: "sm", children: "Add" })] }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: COLUMNS.map((col) => {
                    const columnTasks = groupedTasks[col.id] || [];
                    return (_jsxs("div", { className: "bg-neo-bg-alt/50 rounded-neo p-3 border border-neo-border min-h-[120px] flex flex-col", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("span", { className: "text-sm", children: col.icon }), _jsx("span", { className: "text-[10px] font-mono text-neo-text-dim tracking-wider uppercase flex-1", children: col.title }), _jsx(Badge, { variant: "default", size: "sm", children: columnTasks.length })] }), _jsx("div", { className: "flex-1 space-y-2 overflow-y-auto max-h-[150px] pr-1 custom-scrollbar", children: _jsx(AnimatePresence, { children: columnTasks.length === 0 ? (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "text-center py-4", children: _jsx("p", { className: "text-[10px] font-mono text-neo-text-dim opacity-50", children: "Empty" }) })) : (columnTasks.map((task) => (_jsxs(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, className: `group flex items-start gap-2 bg-neo-surface p-2 rounded border transition-colors ${task.completed ? 'border-neo-success/30 bg-neo-success/5' : 'border-neo-border'}`, children: [_jsx("input", { type: "checkbox", checked: task.completed, onChange: () => toggleTask(task.id), className: "mt-1 cursor-pointer accent-neo-accent" }), _jsx("span", { className: `flex-1 text-xs break-words ${task.completed ? 'line-through text-neo-text-dim opacity-50' : 'text-neo-text'}`, children: task.content }), _jsx("button", { onClick: () => deleteTask(task.id), className: "opacity-0 group-hover:opacity-100 text-[10px] text-neo-danger hover:underline transition-opacity", children: "\u2715" })] }, task.id)))) }) })] }, col.id));
                }) }), _jsxs("div", { className: "flex justify-between items-center mt-2 border-t border-neo-border pt-3", children: [_jsx("span", { className: "text-[10px] font-mono text-neo-text-dim", children: "EISENHOWER MATRIX" }), _jsx(Button, { variant: "outline", size: "sm", onClick: clearCompleted, children: "Clear Completed" })] })] }));
};
//# sourceMappingURL=TaskBoard.js.map