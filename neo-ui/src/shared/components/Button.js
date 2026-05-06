import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
const variantStyles = {
    primary: 'bg-neo-accent text-white hover:bg-neo-accent-hover shadow-lg shadow-neo-accent/20',
    secondary: 'bg-neo-surface text-neo-text border border-neo-border hover:border-neo-accent hover:text-neo-accent',
    outline: 'bg-transparent text-neo-text border border-neo-border hover:border-neo-accent hover:text-neo-accent',
    ghost: 'bg-transparent text-neo-text-dim hover:text-neo-text hover:bg-neo-surface',
    danger: 'bg-neo-danger/10 text-neo-danger border border-neo-danger/30 hover:bg-neo-danger/20',
};
const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
};
export const Button = ({ variant = 'primary', size = 'md', icon, loading = false, children, className = '', disabled, ...props }) => {
    return (_jsxs(motion.button, { whileHover: { scale: disabled ? 1 : 1.02 }, whileTap: { scale: disabled ? 1 : 0.98 }, className: `
        inline-flex items-center justify-center
        font-medium rounded-neo
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-neo-accent/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `, disabled: disabled || loading, ...props, children: [loading ? (_jsxs("svg", { className: "animate-spin h-4 w-4", viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] })) : (icon), children] }));
};
//# sourceMappingURL=Button.js.map