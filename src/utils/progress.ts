import ora from 'ora';
import chalk from 'chalk';
import { ProgressInfo } from '../types';

export class ProgressTracker {
  private spinner: ora.Ora;
  private currentProgress: ProgressInfo;
  private startTime: Date;

  constructor() {
    this.spinner = ora();
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
  start(message: string): void {
    this.spinner.start(message);
  }

  /**
   * Update progress information
   */
  update(progress: Partial<ProgressInfo>): void {
    this.currentProgress = { ...this.currentProgress, ...progress };
    this.updateSpinnerText();
  }

  /**
   * Update the current stage
   */
  setStage(stage: ProgressInfo['stage']): void {
    this.currentProgress.stage = stage;
    this.updateSpinnerText();
  }

  /**
   * Set the total number of items to process
   */
  setTotal(total: number): void {
    this.currentProgress.total = total;
    this.updateSpinnerText();
  }

  /**
   * Increment the current progress
   */
  increment(): void {
    this.currentProgress.current++;
    this.updateSpinnerText();
  }

  /**
   * Set the current URL being processed
   */
  setCurrentUrl(url: string): void {
    this.currentProgress.currentUrl = url;
    this.updateSpinnerText();
  }

  /**
   * Add an error
   */
  addError(): void {
    this.currentProgress.errors++;
    this.updateSpinnerText();
  }

  /**
   * Add a warning
   */
  addWarning(): void {
    this.currentProgress.warnings++;
    this.updateSpinnerText();
  }

  /**
   * Update the spinner text with current progress
   */
  private updateSpinnerText(): void {
    const { current, total, currentUrl, stage, errors, warnings } = this.currentProgress;
    
    let text = `${this.getStageEmoji(stage)} ${this.getStageText(stage)}`;
    
    if (total > 0) {
      const percentage = Math.round((current / total) * 100);
      text += ` ${current}/${total} (${percentage}%)`;
    }
    
    if (currentUrl) {
      text += ` | ${chalk.gray(currentUrl)}`;
    }
    
    if (errors > 0 || warnings > 0) {
      const status = [];
      if (errors > 0) status.push(chalk.red(`${errors} errors`));
      if (warnings > 0) status.push(chalk.yellow(`${warnings} warnings`));
      text += ` | ${status.join(', ')}`;
    }
    
    this.spinner.text = text;
  }

  /**
   * Get emoji for current stage
   */
  private getStageEmoji(stage: ProgressInfo['stage']): string {
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
  private getStageText(stage: ProgressInfo['stage']): string {
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
  succeed(message?: string): void {
    const elapsed = Date.now() - this.startTime.getTime();
    const elapsedText = this.formatDuration(elapsed);
    
    const finalMessage = message || 
      `Completed in ${elapsedText} | ${this.currentProgress.current} pages processed`;
    
    this.spinner.succeed(finalMessage);
  }

  /**
   * Stop the progress tracker with failure
   */
  fail(message?: string): void {
    this.spinner.fail(message || 'Extraction failed');
  }

  /**
   * Stop the progress tracker with warning
   */
  warn(message?: string): void {
    this.spinner.warn(message || 'Extraction completed with warnings');
  }

  /**
   * Format duration in milliseconds to human readable format
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.round((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Get current progress information
   */
  getProgress(): ProgressInfo {
    return { ...this.currentProgress };
  }
}

export class MultiProgressTracker {
  private trackers: Map<string, ProgressTracker> = new Map();

  /**
   * Create a new progress tracker for a specific task
   */
  createTracker(id: string): ProgressTracker {
    const tracker = new ProgressTracker();
    this.trackers.set(id, tracker);
    return tracker;
  }

  /**
   * Get a progress tracker by ID
   */
  getTracker(id: string): ProgressTracker | undefined {
    return this.trackers.get(id);
  }

  /**
   * Remove a progress tracker
   */
  removeTracker(id: string): void {
    this.trackers.delete(id);
  }

  /**
   * Get all active trackers
   */
  getAllTrackers(): Map<string, ProgressTracker> {
    return new Map(this.trackers);
  }
}
