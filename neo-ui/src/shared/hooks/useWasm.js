// ─── useWasm Hook ─────────────────────────────────────────────────────────────
// React hook for lazy WASM initialization with loading/error states.
import { useState, useEffect, useCallback } from 'react';
import { wasmBridge } from '@shared/utils/wasmBridge';
/**
 * React hook for lazy WASM module initialization.
 * Handles loading states, errors, and provides the bridge instance.
 *
 * @param autoInit — Whether to initialize on mount (default: true)
 */
export function useWasm(autoInit = true) {
    const [ready, setReady] = useState(wasmBridge.initialized);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const initialize = useCallback(async () => {
        if (wasmBridge.initialized) {
            setReady(true);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await wasmBridge.init();
            setReady(true);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'WASM initialization failed';
            setError(msg);
            console.error('[useWasm]', msg);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        if (autoInit && !ready) {
            initialize();
        }
    }, [autoInit, ready, initialize]);
    return {
        ready,
        loading,
        error,
        wasm: ready ? wasmBridge : null,
        initialize,
    };
}
//# sourceMappingURL=useWasm.js.map