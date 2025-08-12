import { Page } from 'puppeteer';
import { RenderedPage, ProcessingConfig } from '../types';
import { Logger } from '../types';
export declare class PageRenderer {
    private config;
    private logger;
    constructor(config: ProcessingConfig, logger: Logger);
    /**
     * Render a page and wait for content to load
     */
    render(page: Page, url: string): Promise<RenderedPage>;
    /**
     * Wait for React hydration to complete
     */
    private waitForReactHydration;
    /**
     * Wait for dynamic content to load
     */
    private waitForDynamicContent;
    /**
     * Check if page has loaded successfully
     */
    isPageLoaded(page: Page): Promise<boolean>;
    /**
     * Get page performance metrics
     */
    getPerformanceMetrics(page: Page): Promise<{
        loadTime: number;
        domContentLoaded: number;
        firstPaint: number;
        firstContentfulPaint: number;
    }>;
    /**
     * Take a screenshot of the page (for debugging)
     */
    takeScreenshot(page: Page, filePath: string): Promise<void>;
}
//# sourceMappingURL=page-renderer.d.ts.map