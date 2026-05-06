import { wasmBridge } from '@shared/utils/wasmBridge';
interface UseWasmResult {
    /** Whether the WASM module is ready */
    ready: boolean;
    /** Whether initialization is in progress */
    loading: boolean;
    /** Error message if initialization failed */
    error: string | null;
    /** The WASM bridge instance (null if not ready) */
    wasm: typeof wasmBridge | null;
    /** Manually trigger (re)initialization */
    initialize: () => Promise<void>;
}
/**
 * React hook for lazy WASM module initialization.
 * Handles loading states, errors, and provides the bridge instance.
 *
 * @param autoInit — Whether to initialize on mount (default: true)
 */
export declare function useWasm(autoInit?: boolean): UseWasmResult;
export {};
//# sourceMappingURL=useWasm.d.ts.map