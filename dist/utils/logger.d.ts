import { Logger, ExtractionLog } from '../types';
export declare class ConsoleLogger implements Logger {
    private logs;
    private verbose;
    constructor(verbose?: boolean);
    info(message: string, metadata?: any): void;
    warn(message: string, metadata?: any): void;
    error(message: string, metadata?: any): void;
    debug(message: string, metadata?: any): void;
    success(message: string): void;
    private log;
    /**
     * Get all logs for export or analysis
     */
    getLogs(): ExtractionLog[];
    /**
     * Clear logs
     */
    clearLogs(): void;
    /**
     * Export logs to file
     */
    exportLogs(filePath: string): Promise<void>;
}
export declare class FileLogger extends ConsoleLogger {
    private logFilePath;
    constructor(logFilePath: string, verbose?: boolean);
    private writeToFile;
    info(message: string, metadata?: any): Promise<void>;
    warn(message: string, metadata?: any): Promise<void>;
    error(message: string, metadata?: any): Promise<void>;
    debug(message: string, metadata?: any): Promise<void>;
}
//# sourceMappingURL=logger.d.ts.map