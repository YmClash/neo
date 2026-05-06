export interface ProbeConfig {
    selectors: {
        [key: string]: string;
    };
    extract_text: boolean;
    extract_links: boolean;
    extract_images: boolean;
}
export interface ExtractionResult {
    id: string;
    url: string;
    title: string;
    timestamp: number;
    data: Record<string, string | string[]>;
    success: boolean;
    error?: string;
}
export declare function useProbes(): {
    results: ExtractionResult[];
    loading: boolean;
    isProbing: boolean;
    executeProbe: (config: ProbeConfig) => Promise<void>;
    clearResults: () => Promise<void>;
};
//# sourceMappingURL=useProbes.d.ts.map