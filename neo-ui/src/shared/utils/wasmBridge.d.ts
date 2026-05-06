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
declare class WasmBridge {
    private module;
    private initPromise;
    private _initialized;
    /** Initialize the WASM module (lazy, singleton) */
    init(): Promise<void>;
    private _doInit;
    get initialized(): boolean;
    hash(input: string): string;
    verify(input: string, expectedHash: string): boolean;
    fingerprint(data: string): string;
    createMetricsEngine(capacity: number): WasmMetricsEngine;
    createDataParser(): WasmDataParser;
    version(): string;
    private assertInit;
}
/** Global singleton instance */
export declare const wasmBridge: WasmBridge;
export {};
//# sourceMappingURL=wasmBridge.d.ts.map