import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Badge } from '@shared/components';
import { useFocusTimer } from '@shared/hooks';
export const FocusTimerWidget = ({ compact = false }) => {
    const { focusState, formattedTime, startTimer, stopTimer } = useFocusTimer();
    const [minutes, setMinutes] = useState(25);
    const handleStart = () => startTimer(minutes);
    if (compact) {
        return (_jsxs(Card, { variant: "glass", padding: "sm", className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xl", children: focusState.isActive ? '⏱️' : '⏳' }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-mono font-bold tracking-wider text-neo-text", children: focusState.isActive ? formattedTime : `${minutes}:00` }), _jsx("div", { className: "text-[10px] text-neo-text-dim", children: "FOCUS" })] })] }), _jsx(Button, { variant: focusState.isActive ? 'danger' : 'primary', size: "sm", onClick: focusState.isActive ? stopTimer : handleStart, children: focusState.isActive ? 'STOP' : 'START' })] }));
    }
    // Full version for Dashboard
    const progress = focusState.isActive && focusState.endTime && focusState.startTime
        ? 100 - ((focusState.endTime - Date.now()) / (focusState.endTime - focusState.startTime)) * 100
        : 0;
    return (_jsxs(Card, { variant: "glass", padding: "lg", className: "relative overflow-hidden", children: [focusState.isActive && (_jsx(motion.div, { className: "absolute inset-0 bg-neo-accent/10 z-0", initial: { width: `${progress}%` }, animate: { width: `${progress}%` }, transition: { duration: 1, ease: 'linear' }, style: { transformOrigin: 'left' } })), _jsxs("div", { className: "relative z-10 flex flex-col items-center text-center", children: [_jsx(Badge, { variant: focusState.isActive ? 'success' : 'default', dot: true, className: "mb-4", children: focusState.isActive ? 'FOCUS ACTIVE' : 'READY' }), _jsx("div", { className: "text-6xl font-display font-bold neo-gradient-text tracking-widest mb-6", children: focusState.isActive ? formattedTime : `${minutes}:00` }), !focusState.isActive ? (_jsxs("div", { className: "flex flex-col items-center gap-4 w-full", children: [_jsx("div", { className: "flex items-center gap-2", children: [15, 25, 50].map((m) => (_jsxs(Button, { variant: minutes === m ? 'primary' : 'outline', size: "sm", onClick: () => setMinutes(m), children: [m, "m"] }, m))) }), _jsx(Button, { variant: "primary", className: "w-full", onClick: handleStart, children: "START FOCUS SESSION" })] })) : (_jsx(Button, { variant: "danger", className: "w-full", onClick: stopTimer, children: "ABORT SESSION" }))] })] }));
};
//# sourceMappingURL=FocusTimerWidget.js.map