import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
const variantStyles = {
    default: 'bg-neo-surface border border-neo-border rounded-neo',
    glass: 'neo-glass',
    glow: 'bg-neo-surface border border-neo-accent/30 rounded-neo neo-glow-border',
    flat: 'bg-neo-bg-alt rounded-neo',
};
const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
};
export const Card = ({ variant = 'default', header, footer, padding = 'md', hoverable = false, children, className = '', ...props }) => {
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: 'easeOut' }, whileHover: hoverable ? { y: -2, transition: { duration: 0.2 } } : undefined, className: `
        ${variantStyles[variant]}
        ${hoverable ? 'cursor-pointer hover:border-neo-accent/50 transition-colors' : ''}
        ${className}
      `, ...props, children: [header && (_jsx("div", { className: "px-4 py-3 border-b border-neo-border flex items-center justify-between", children: header })), _jsx("div", { className: paddingStyles[padding], children: children }), footer && (_jsx("div", { className: "px-4 py-3 border-t border-neo-border", children: footer }))] }));
};
//# sourceMappingURL=Card.js.map