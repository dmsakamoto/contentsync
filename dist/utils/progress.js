"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiProgressTracker = exports.ProgressTracker = void 0;
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
class ProgressTracker {
    constructor() {
        this.spinner = (0, ora_1.default)();
        this.currentProgress = {
            current: 0,
            total: 0,
            currentUrl: '',
            stage: 'discovery',
            errors: 0,
            warnings: 0,
        };
        this.startTime = new Date();
    }
    /**
     * Start the progress tracker
     */
    start(message) {
        this.spinner.start(message);
    }
    /**
     * Update progress information
     */
    update(progress) {
        this.currentProgress = { ...this.currentProgress, ...progress };
        this.updateSpinnerText();
    }
    /**
     * Update the current stage
     */
    setStage(stage) {
        this.currentProgress.stage = stage;
        this.updateSpinnerText();
    }
    /**
     * Set the total number of items to process
     */
    setTotal(total) {
        this.currentProgress.total = total;
        this.updateSpinnerText();
    }
    /**
     * Increment the current progress
     */
    increment() {
        this.currentProgress.current++;
        this.updateSpinnerText();
    }
    /**
     * Set the current URL being processed
     */
    setCurrentUrl(url) {
        this.currentProgress.currentUrl = url;
        this.updateSpinnerText();
    }
    /**
     * Add an error
     */
    addError() {
        this.currentProgress.errors++;
        this.updateSpinnerText();
    }
    /**
     * Add a warning
     */
    addWarning() {
        this.currentProgress.warnings++;
        this.updateSpinnerText();
    }
    /**
     * Update the spinner text with current progress
     */
    updateSpinnerText() {
        const { current, total, currentUrl, stage, errors, warnings } = this.currentProgress;
        let text = `${this.getStageEmoji(stage)} ${this.getStageText(stage)}`;
        if (total > 0) {
            const percentage = Math.round((current / total) * 100);
            text += ` ${current}/${total} (${percentage}%)`;
        }
        if (currentUrl) {
            text += ` | ${chalk_1.default.gray(currentUrl)}`;
        }
        if (errors > 0 || warnings > 0) {
            const status = [];
            if (errors > 0)
                status.push(chalk_1.default.red(`${errors} errors`));
            if (warnings > 0)
                status.push(chalk_1.default.yellow(`${warnings} warnings`));
            text += ` | ${status.join(', ')}`;
        }
        this.spinner.text = text;
    }
    /**
     * Get emoji for current stage
     */
    getStageEmoji(stage) {
        switch (stage) {
            case 'discovery': return '🔍';
            case 'rendering': return '🌐';
            case 'parsing': return '📝';
            case 'writing': return '💾';
            default: return '⚙️';
        }
    }
    /**
     * Get text for current stage
     */
    getStageText(stage) {
        switch (stage) {
            case 'discovery': return 'Discovering pages';
            case 'rendering': return 'Rendering pages';
            case 'parsing': return 'Parsing content';
            case 'writing': return 'Writing files';
            default: return 'Processing';
        }
    }
    /**
     * Stop the progress tracker with success
     */
    succeed(message) {
        const elapsed = Date.now() - this.startTime.getTime();
        const elapsedText = this.formatDuration(elapsed);
        const finalMessage = message ||
            `Completed in ${elapsedText} | ${this.currentProgress.current} pages processed`;
        this.spinner.succeed(finalMessage);
    }
    /**
     * Stop the progress tracker with failure
     */
    fail(message) {
        this.spinner.fail(message || 'Extraction failed');
    }
    /**
     * Stop the progress tracker with warning
     */
    warn(message) {
        this.spinner.warn(message || 'Extraction completed with warnings');
    }
    /**
     * Format duration in milliseconds to human readable format
     */
    formatDuration(ms) {
        if (ms < 1000)
            return `${ms}ms`;
        if (ms < 60000)
            return `${Math.round(ms / 1000)}s`;
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.round((ms % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    }
    /**
     * Get current progress information
     */
    getProgress() {
        return { ...this.currentProgress };
    }
}
exports.ProgressTracker = ProgressTracker;
class MultiProgressTracker {
    constructor() {
        this.trackers = new Map();
    }
    /**
     * Create a new progress tracker for a specific task
     */
    createTracker(id) {
        const tracker = new ProgressTracker();
        this.trackers.set(id, tracker);
        return tracker;
    }
    /**
     * Get a progress tracker by ID
     */
    getTracker(id) {
        return this.trackers.get(id);
    }
    /**
     * Remove a progress tracker
     */
    removeTracker(id) {
        this.trackers.delete(id);
    }
    /**
     * Get all active trackers
     */
    getAllTrackers() {
        return new Map(this.trackers);
    }
}
exports.MultiProgressTracker = MultiProgressTracker;
//# sourceMappingURL=progress.js.map