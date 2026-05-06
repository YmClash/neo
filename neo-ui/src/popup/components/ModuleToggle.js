import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
export const ModuleToggle = ({ module, onToggle }) => {
    return (_jsxs("div", { className: `
        flex items-center gap-3 p-3 rounded-neo
        border transition-all duration-200 cursor-pointer
        ${module.enabled
            ? 'bg-neo-accent/5 border-neo-accent/30 hover:border-neo-accent/50'
            : 'bg-neo-surface/50 border-neo-border hover:border-neo-border'}
      `, onClick: onToggle, role: "switch", "aria-checked": module.enabled, tabIndex: 0, onKeyDown: (e) => e.key === 'Enter' && onToggle(), children: [_jsx("span", { className: "text-xl flex-shrink-0", children: module.icon }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `text-sm font-medium ${module.enabled ? 'text-neo-text' : 'text-neo-text-dim'}`, children: module.name }), _jsxs("span", { className: "text-[9px] font-mono text-neo-text-dim", children: ["v", module.version] })] }), _jsx("p", { className: "text-[10px] text-neo-text-dim truncate mt-0.5", children: module.description })] }), _jsxs("div", { className: `
          relative w-10 h-5 rounded-full transition-colors duration-200
          ${module.enabled ? 'bg-neo-accent' : 'bg-neo-border'}
        `, children: [_jsx(motion.div, { animate: { x: module.enabled ? 20 : 2 }, transition: { type: 'spring', stiffness: 500, damping: 30 }, className: `
            absolute top-0.5 w-4 h-4 rounded-full
            ${module.enabled ? 'bg-white shadow-lg' : 'bg-neo-text-dim'}
          ` }), module.enabled && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "absolute inset-0 rounded-full", style: {
                            boxShadow: '0 0 8px var(--neo-glow)',
                        } }))] })] }));
};
//# sourceMappingURL=ModuleToggle.js.map