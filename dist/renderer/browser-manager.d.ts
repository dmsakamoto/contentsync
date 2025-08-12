import { Page } from 'puppeteer';
import { BrowserConfig } from '../types';
import { Logger } from '../types';
export declare class BrowserManager {
    private browser;
    private config;
    private logger;
    private pagePool;
    private maxPages;
    constructor(config: BrowserConfig, logger: Logger, maxPages?: number);
    /**
     * Initialize the browser
     */
    initialize(): Promise<void>;
    /**
     * Get a page from the pool or create a new one
     */
    getPage(): Promise<Page>;
    /**
     * Create a new page with proper configuration
     */
    private createNewPage;
    /**
     * Return a page to the pool for reuse
     */
    returnPage(page: Page): Promise<void>;
    /**
     * Close a specific page
     */
    private closePage;
    /**
     * Get browser information
     */
    getBrowserInfo(): Promise<{
        version: string;
        userAgent: string;
    }>;
    /**
     * Check if browser is healthy
     */
    isHealthy(): Promise<boolean>;
    /**
     * Restart the browser if needed
     */
    restartIfNeeded(): Promise<void>;
    /**
     * Clean up resources
     */
    cleanup(): Promise<void>;
    /**
     * Get current pool status
     */
    getPoolStatus(): {
        total: number;
        available: number;
    };
}
//# sourceMappingURL=browser-manager.d.ts.map