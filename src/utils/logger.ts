import chalk from 'chalk';
import { Logger, ExtractionLog } from '../types';

export class ConsoleLogger implements Logger {
  private logs: ExtractionLog[] = [];
  private verbose: boolean;

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  info(message: string, metadata?: any): void {
    this.log('info', message, metadata);
    console.log(chalk.blue(`ℹ ${message}`));
  }

  warn(message: string, metadata?: any): void {
    this.log('warn', message, metadata);
    console.log(chalk.yellow(`⚠ ${message}`));
  }

  error(message: string, metadata?: any): void {
    this.log('error', message, metadata);
    console.log(chalk.red(`✖ ${message}`));
  }

  debug(message: string, metadata?: any): void {
    this.log('info', message, metadata);
    if (this.verbose) {
      console.log(chalk.gray(`🔍 ${message}`));
    }
  }

  success(message: string): void {
    console.log(chalk.green(`✓ ${message}`));
  }

  private log(level: 'info' | 'warn' | 'error', message: string, metadata?: any): void {
    const logEntry: ExtractionLog = {
      level,
      timestamp: new Date(),
      message,
      metadata,
    };

    this.logs.push(logEntry);
  }

  /**
   * Get all logs for export or analysis
   */
  getLogs(): ExtractionLog[] {
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs to file
   */
  async exportLogs(filePath: string): Promise<void> {
    const fs = await import('fs-extra');
    const logData = {
      timestamp: new Date(),
      logs: this.logs,
    };
    await fs.writeJson(filePath, logData, { spaces: 2 });
  }
}

export class FileLogger extends ConsoleLogger {
  private logFilePath: string;

  constructor(logFilePath: string, verbose = false) {
    super(verbose);
    this.logFilePath = logFilePath;
  }

  private async writeToFile(level: string, message: string, metadata?: any): Promise<void> {
    const fs = await import('fs-extra');
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    await fs.appendFile(this.logFilePath, logLine);
  }

  async info(message: string, metadata?: any): Promise<void> {
    super.info(message, metadata);
    await this.writeToFile('info', message, metadata);
  }

  async warn(message: string, metadata?: any): Promise<void> {
    super.warn(message, metadata);
    await this.writeToFile('warn', message, metadata);
  }

  async error(message: string, metadata?: any): Promise<void> {
    super.error(message, metadata);
    await this.writeToFile('error', message, metadata);
  }

  async debug(message: string, metadata?: any): Promise<void> {
    super.debug(message, metadata);
    await this.writeToFile('debug', message, metadata);
  }
}
