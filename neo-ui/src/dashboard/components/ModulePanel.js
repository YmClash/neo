import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { Card, Badge, Button } from '@shared/components';
export const ModulePanel = ({ modules, onToggle }) => {
    return (_jsx(Card, { variant: "glass", padding: "none", children: _jsx("div", { className: "divide-y divide-neo-border", children: modules.map((module, index) => (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: index * 0.05 }, className: "p-4 hover:bg-neo-bg-alt/50 transition-colors", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: `
                  w-10 h-10 rounded-neo flex items-center justify-center text-xl
                  ${module.enabled
                                ? 'bg-neo-accent/10 border border-neo-accent/30'
                                : 'bg-neo-surface border border-neo-border'}
                `, children: module.icon }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-medium text-neo-text", children: module.name }), _jsx(Badge, { variant: module.enabled ? 'success' : 'default', dot: true, size: "sm", children: module.status.toUpperCase() })] }), _jsx("p", { className: "text-xs text-neo-text-dim mt-0.5", children: module.description })] }), _jsx("div", { className: "flex items-center gap-2", children: _jsx(Button, { variant: module.enabled ? 'danger' : 'primary', size: "sm", onClick: () => onToggle(module.id), children: module.enabled ? 'Disable' : 'Enable' }) })] }) }, module.id))) }) }));
};
//# sourceMappingURL=ModulePanel.js.map