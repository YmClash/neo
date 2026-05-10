export interface SystemMetrics {
    cpu_percent: number;
    memory_percent: number;
    memory_used_mb: number;
    memory_total_mb: number;
    disk_percent: number;
    disk_used_gb: number;
    disk_total_gb: number;
    network_sent_mb: number;
    network_recv_mb: number;
    top_processes: Array<{
        pid: number;
        name: string;
        cpu_percent: number;
        memory_percent: number;
    }>;
    panic: {
        panic: boolean;
        level: string;
        reason: string;
        recovering: boolean;
        consecutive: number;
    };
    latency_ms: number;
    timestamp: string;
}
export interface MetricsHistoryPoint {
    ts: number;
    cpu: number;
    ram: number;
    disk: number;
}
export interface UseSystemMetricsReturn {
    current: SystemMetrics | null;
    history: MetricsHistoryPoint[];
    isConnected: boolean;
    isPanic: boolean;
    panicLevel: string;
    panicReason: string;
    error: string | null;
    lastUpdate: number | null;
    manualPoll: () => void;
}
export declare function useSystemMetrics(): UseSystemMetricsReturn;
//# sourceMappingURL=useSystemMetrics.d.ts.map