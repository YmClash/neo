export interface FocusState {
    isActive: boolean;
    startTime: number | null;
    endTime: number | null;
    durationMinutes: number;
}
export declare function useFocusTimer(): {
    focusState: FocusState;
    timeLeft: number;
    formattedTime: string;
    startTimer: (minutes?: number) => Promise<void>;
    stopTimer: () => Promise<void>;
};
//# sourceMappingURL=useFocusTimer.d.ts.map