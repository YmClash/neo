export interface ContextEvent {
    ts: number;
    type: string;
    data: Record<string, unknown>;
}
export interface UseContextBufferReturn {
    events: ContextEvent[];
    totalCount: number;
    clear: () => Promise<void>;
    getIcon: (type: string) => string;
    getLabel: (type: string) => string;
}
export declare function useContextBuffer(): UseContextBufferReturn;
//# sourceMappingURL=useContextBuffer.d.ts.map