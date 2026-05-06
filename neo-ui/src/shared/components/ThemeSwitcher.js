import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { useChromeStorage } from '@shared/hooks';
import { STORAGE_KEYS } from '@shared/utils/storage';
const THEMES = [
    {
        name: 'egghead',
        label: 'Egghead',
        icon: '🔵',
        colors: { primary: '#0a0e1a', accent: '#6366f1' },
    },
    {
        name: 'matrix',
        label: 'Matrix',
        icon: '🟢',
        colors: { primary: '#0a0a0a', accent: '#00ff41' },
    },
    {
        name: 'punk',
        label: 'Punk',
        icon: '🔴',
        colors: { primary: '#0f0a0a', accent: '#ef4444' },
    },
];
export const ThemeSwitcher = ({ compact = false, className = '', }) => {
    const [currentTheme, setTheme] = useChromeStorage(STORAGE_KEYS.THEME, 'egghead');
    const handleThemeChange = async (theme) => {
        await setTheme(theme);
        // Apply theme to DOM
        document.documentElement.setAttribute('data-theme', theme);
    };
    return (_jsxs("div", { className: `flex items-center gap-2 ${className}`, children: [!compact && (_jsx("span", { className: "text-xs text-neo-text-dim font-mono mr-1", children: "THEME" })), THEMES.map((theme) => (_jsxs(motion.button, { whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 }, onClick: () => handleThemeChange(theme.name), className: `
            relative w-7 h-7 rounded-full
            flex items-center justify-center
            text-sm
            transition-all duration-200
            ${currentTheme === theme.name
                    ? 'ring-2 ring-neo-accent ring-offset-2 ring-offset-neo-bg'
                    : 'opacity-60 hover:opacity-100'}
          `, style: { backgroundColor: theme.colors.primary }, title: theme.label, "aria-label": `Switch to ${theme.label} theme`, children: [_jsx("span", { className: "text-xs", children: theme.icon }), currentTheme === theme.name && (_jsx(motion.div, { layoutId: "theme-indicator", className: "absolute inset-0 rounded-full", style: {
                            border: `2px solid ${theme.colors.accent}`,
                            boxShadow: `0 0 8px ${theme.colors.accent}40`,
                        } }))] }, theme.name)))] }));
};
//# sourceMappingURL=ThemeSwitcher.js.map