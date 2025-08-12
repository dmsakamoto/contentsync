import { ProgressInfo } from '../types';
export declare class ProgressTracker {
    private spinner;
    private currentProgress;
    private startTime;
    constructor();
    /**
     * Start the progress tracker
     */
    start(message: string): void;
    /**
     * Update progress information
     */
    update(progress: Partial<ProgressInfo>): void;
    /**
     * Update the current stage
     */
    setStage(stage: ProgressInfo['stage']): void;
    /**
     * Set the total number of items to process
     */
    setTotal(total: number): void;
    /**
     * Increment the current progress
     */
    increment(): void;
    /**
     * Set the current URL being processed
     */
    setCurrentUrl(url: string): void;
    /**
     * Add an error
     */
    addError(): void;
    /**
     * Add a warning
     */
    addWarning(): void;
    /**
     * Update the spinner text with current progress
     */
    private updateSpinnerText;
    /**
     * Get emoji for current stage
     */
    private getStageEmoji;
    /**
     * Get text for current stage
     */
    private getStageText;
    /**
     * Stop the progress tracker with success
     */
    succeed(message?: string): void;
    /**
     * Stop the progress tracker with failure
     */
    fail(message?: string): void;
    /**
     * Stop the progress tracker with warning
     */
    warn(message?: string): void;
    /**
     * Format duration in milliseconds to human readable format
     */
    private formatDuration;
    /**
     * Get current progress information
     */
    getProgress(): ProgressInfo;
}
export declare class MultiProgressTracker {
    private trackers;
    /**
     * Create a new progress tracker for a specific task
     */
    createTracker(id: string): ProgressTracker;
    /**
     * Get a progress tracker by ID
     */
    getTracker(id: string): ProgressTracker | undefined;
    /**
     * Remove a progress tracker
     */
    removeTracker(id: string): void;
    /**
     * Get all active trackers
     */
    getAllTrackers(): Map<string, ProgressTracker>;
}
//# sourceMappingURL=progress.d.ts.map