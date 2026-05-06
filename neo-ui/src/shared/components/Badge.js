import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const variantStyles = {
    default: 'bg-neo-surface text-neo-text-dim border border-neo-border',
    success: 'bg-neo-success/10 text-neo-success border border-neo-success/30',
    warning: 'bg-neo-warning/10 text-neo-warning border border-neo-warning/30',
    danger: 'bg-neo-danger/10 text-neo-danger border border-neo-danger/30',
    info: 'bg-neo-info/10 text-neo-info border border-neo-info/30',
    accent: 'bg-neo-accent/10 text-neo-accent border border-neo-accent/30',
};
const dotColors = {
    default: 'bg-neo-text-dim',
    success: 'bg-neo-success',
    warning: 'bg-neo-warning',
    danger: 'bg-neo-danger',
    info: 'bg-neo-info',
    accent: 'bg-neo-accent',
};
const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
};
export const Badge = ({ variant = 'default', size = 'sm', dot = false, pulse = false, children, className = '', }) => {
    return (_jsxs("span", { className: `
        inline-flex items-center gap-1.5
        font-mono font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `, children: [dot && (_jsxs("span", { className: "relative flex h-2 w-2", children: [pulse && (_jsx("span", { className: `animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[variant]}` })), _jsx("span", { className: `relative inline-flex rounded-full h-2 w-2 ${dotColors[variant]}` })] })), children] }));
};
//# sourceMappingURL=Badge.js.map