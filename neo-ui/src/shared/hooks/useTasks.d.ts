export type TaskCategory = 'urgent-important' | 'important' | 'urgent' | 'delegate';
export interface NeoTask {
    id: string;
    content: string;
    category: TaskCategory;
    completed: boolean;
    timestamp: number;
}
export declare function useTasks(): {
    tasks: NeoTask[];
    groupedTasks: Record<TaskCategory, NeoTask[]>;
    loading: boolean;
    addTask: (content: string, category: TaskCategory) => Promise<void>;
    toggleTask: (taskId: string) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    clearCompleted: () => Promise<void>;
};
//# sourceMappingURL=useTasks.d.ts.map