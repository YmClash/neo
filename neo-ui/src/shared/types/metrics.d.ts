/** A single metric data point */
export interface MetricPoint {
    timestamp: number;
    value: number;
    label: string;
}
/** Aggregated statistics from the WASM metrics engine */
export interface MetricsSummary {
    count: number;
    mean: number;
    median: number;
    min: number;
    max: number;
    std_dev: number;
    p95: number;
    p99: number;
}
/** Time series data for chart rendering */
export interface TimeSeries {
    id: string;
    name: string;
    color: string;
    data: MetricPoint[];
}
/** Focus session tracking */
export interface FocusSession {
    id: string;
    startTime: number;
    endTime?: number;
    duration: number;
    breaks: number;
    label: string;
    completed: boolean;
}
/** System resource metrics (from Python bridge) */
export interface SystemMetrics {
    cpu_percent: number;
    memory_percent: number;
    memory_used_mb: number;
    memory_total_mb: number;
    disk_percent: number;
    network_sent_bytes: number;
    network_recv_bytes: number;
    timestamp: number;
}
/** Web probe extraction result */
export interface ProbeResult {
    url: string;
    timestamp: number;
    data: Record<string, unknown>;
    hash: string;
    success: boolean;
    error?: string;
}
/** Task item for the task manager */
export interface TaskItem {
    id: string;
    title: string;
    description?: string;
    priority: 'urgent-important' | 'important' | 'urgent' | 'delegate';
    status: 'todo' | 'in-progress' | 'done';
    createdAt: number;
    updatedAt: number;
    dueDate?: number;
    tags: string[];
}
//# sourceMappingURL=metrics.d.ts.map