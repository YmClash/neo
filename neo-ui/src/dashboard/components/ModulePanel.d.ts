import React from 'react';
import type { NeoModule, ModuleId } from '@shared/types';
interface ModulePanelProps {
    modules: NeoModule[];
    onToggle: (id: ModuleId) => void;
}
export declare const ModulePanel: React.FC<ModulePanelProps>;
export {};
//# sourceMappingURL=ModulePanel.d.ts.map