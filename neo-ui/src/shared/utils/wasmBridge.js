// ─── WASM Bridge ──────────────────────────────────────────────────────────────
// TypeScript abstraction layer for the Neo Core WASM module.
// Handles lazy initialization and provides typed access to Rust functions.
// ─── Singleton WASM Manager ───────────────────────────────────────────────────
class WasmBridge {
    module = null;
    initPromise = null;
    _initialized = false;
    /** Initialize the WASM module (lazy, singleton) */
    async init() {
        if (this._initialized)
            return;
        if (this.initPromise)
            return this.initPromise;
        this.initPromise = this._doInit();
        return this.initPromise;
    }
    async _doInit() {
        try {
            // Dynamic import of the wasm-pack generated module
            this.module = await import('@wasm/neo_core.js');
            await this.module.default();
            const status = this.module.neo_init();
            console.log(`[Neo WASM Bridge] ${status}`);
            this._initialized = true;
        }
        catch (err) {
            console.error('[Neo WASM Bridge] Initialization failed:', err);
            this.initPromise = null;
            throw err;
        }
    }
    get initialized() {
        return this._initialized;
    }
    // ─── Crypto Functions ─────────────────────────────────────────────────
    hash(input) {
        this.assertInit();
        return this.module.neo_hash(input);
    }
    verify(input, expectedHash) {
        this.assertInit();
        return this.module.neo_verify(input, expectedHash);
    }
    fingerprint(data) {
        this.assertInit();
        return this.module.neo_fingerprint(data);
    }
    // ─── Metrics Engine ───────────────────────────────────────────────────
    createMetricsEngine(capacity) {
        this.assertInit();
        return new this.module.MetricsEngine(capacity);
    }
    // ─── Data Parser ──────────────────────────────────────────────────────
    createDataParser() {
        this.assertInit();
        return new this.module.DataParser();
    }
    // ─── Version ──────────────────────────────────────────────────────────
    version() {
        this.assertInit();
        return this.module.neo_version();
    }
    // ─── Internal ─────────────────────────────────────────────────────────
    assertInit() {
        if (!this._initialized || !this.module) {
            throw new Error('[Neo WASM Bridge] Module not initialized. Call init() first.');
        }
    }
}
/** Global singleton instance */
export const wasmBridge = new WasmBridge();
//# sourceMappingURL=wasmBridge.js.map