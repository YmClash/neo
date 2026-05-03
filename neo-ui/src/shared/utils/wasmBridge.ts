// ─── WASM Bridge ──────────────────────────────────────────────────────────────
// TypeScript abstraction layer for the Neo Core WASM module.
// Handles lazy initialization and provides typed access to Rust functions.

// Dynamic import types — these match the wasm-pack generated exports
interface NeoWasmModule {
  default: (input?: WebAssembly.Module) => Promise<void>;
  neo_init: () => string;
  neo_version: () => string;
  neo_hash: (input: string) => string;
  neo_verify: (input: string, hash: string) => boolean;
  neo_hash_batch: (inputs_json: string) => string;
  neo_fingerprint: (data: string) => string;
  MetricsEngine: new (capacity: number) => WasmMetricsEngine;
  DataParser: new () => WasmDataParser;
}

interface WasmMetricsEngine {
  push(value: number): void;
  push_batch(json_values: string): number;
  count(): number;
  mean(): number;
  median(): number;
  min(): number;
  max(): number;
  std_dev(): number;
  percentile(p: number): number;
  summary_json(): string;
  clear(): void;
}

interface WasmDataParser {
  extract_keys(json_input: string, keys_json: string): string;
  filter_array(json_array: string, field: string, contains: string): string;
  to_metric_series(values_json: string, label: string): string;
  count_occurrences(text: string, pattern: string): number;
  word_frequency(text: string): string;
}

// ─── Singleton WASM Manager ───────────────────────────────────────────────────

class WasmBridge {
  private module: NeoWasmModule | null = null;
  private initPromise: Promise<void> | null = null;
  private _initialized = false;

  /** Initialize the WASM module (lazy, singleton) */
  async init(): Promise<void> {
    if (this._initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<void> {
    try {
      // Dynamic import of the wasm-pack generated module
      this.module = await import('@wasm/neo_core.js') as unknown as NeoWasmModule;
      await this.module.default();
      const status = this.module.neo_init();
      console.log(`[Neo WASM Bridge] ${status}`);
      this._initialized = true;
    } catch (err) {
      console.error('[Neo WASM Bridge] Initialization failed:', err);
      this.initPromise = null;
      throw err;
    }
  }

  get initialized(): boolean {
    return this._initialized;
  }

  // ─── Crypto Functions ─────────────────────────────────────────────────

  hash(input: string): string {
    this.assertInit();
    return this.module!.neo_hash(input);
  }

  verify(input: string, expectedHash: string): boolean {
    this.assertInit();
    return this.module!.neo_verify(input, expectedHash);
  }

  fingerprint(data: string): string {
    this.assertInit();
    return this.module!.neo_fingerprint(data);
  }

  // ─── Metrics Engine ───────────────────────────────────────────────────

  createMetricsEngine(capacity: number): WasmMetricsEngine {
    this.assertInit();
    return new this.module!.MetricsEngine(capacity);
  }

  // ─── Data Parser ──────────────────────────────────────────────────────

  createDataParser(): WasmDataParser {
    this.assertInit();
    return new this.module!.DataParser();
  }

  // ─── Version ──────────────────────────────────────────────────────────

  version(): string {
    this.assertInit();
    return this.module!.neo_version();
  }

  // ─── Internal ─────────────────────────────────────────────────────────

  private assertInit(): void {
    if (!this._initialized || !this.module) {
      throw new Error('[Neo WASM Bridge] Module not initialized. Call init() first.');
    }
  }
}

/** Global singleton instance */
export const wasmBridge = new WasmBridge();
