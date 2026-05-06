import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Badge } from '@shared/components';
export const StatusBar = ({ wasmReady, wasmLoading, activeCount, totalCount: _totalCount, }) => {
    return (_jsxs("div", { className: "flex items-center gap-2 px-4 py-2 bg-neo-bg-alt border-b border-neo-border", children: [_jsxs(Badge, { variant: wasmReady ? 'success' : wasmLoading ? 'warning' : 'danger', dot: true, pulse: wasmLoading, size: "sm", children: ["WASM ", wasmReady ? 'OK' : wasmLoading ? 'INIT' : 'OFF'] }), _jsxs(Badge, { variant: activeCount > 0 ? 'info' : 'default', dot: true, size: "sm", children: [activeCount, " MOD"] }), _jsx("div", { className: "flex-1" }), _jsx("span", { className: "text-[9px] font-mono text-neo-text-dim", children: new Date().toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                }) })] }));
};
//# sourceMappingURL=StatusBar.js.map