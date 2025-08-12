import { Page } from 'puppeteer';
import { RenderedPage, ProcessingConfig } from '../types';
import { Logger } from '../types';

export class PageRenderer {
  private config: ProcessingConfig;
  private logger: Logger;

  constructor(config: ProcessingConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Render a page and wait for content to load
   */
  async render(page: Page, url: string): Promise<RenderedPage> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      this.logger.debug(`Rendering page: ${url}`);

      // Navigate to the page
      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      if (!response) {
        throw new Error('No response received from page');
      }

      if (!response.ok()) {
        throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
      }

      // Wait for specific selector if configured
      if (this.config.waitForSelector) {
        try {
          await page.waitForSelector(this.config.waitForSelector, {
            timeout: 10000,
          });
        } catch (error) {
          this.logger.warn(`Selector "${this.config.waitForSelector}" not found on ${url}`);
          errors.push(`Selector wait failed: ${this.config.waitForSelector}`);
        }
      }

      // Wait for additional time if configured
      if (this.config.waitTime && this.config.waitTime > 0) {
        await page.waitForTimeout(this.config.waitTime);
      }

      // Wait for React to hydrate (if it's a React app)
      await this.waitForReactHydration(page);

      // Wait for dynamic content to load
      await this.waitForDynamicContent(page);

      // Get the final HTML and title
      const html = await page.content();
      const title = await page.title();

      const loadTime = Date.now() - startTime;

      this.logger.debug(`Page rendered successfully: ${url} (${loadTime}ms)`);

      return {
        url,
        title,
        html,
        renderedAt: new Date(),
        loadTime,
        errors,
      };
    } catch (error) {
      const loadTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error(`Failed to render page ${url}: ${errorMessage}`);
      errors.push(errorMessage);

      return {
        url,
        title: '',
        html: '',
        renderedAt: new Date(),
        loadTime,
        errors,
      };
    }
  }

  /**
   * Wait for React hydration to complete
   */
  private async waitForReactHydration(page: Page): Promise<void> {
    try {
      // Wait for React to be available and hydrated
      await page.waitForFunction(() => {
        // Check if React is available
        if (typeof window !== 'undefined' && (window as any).React) {
          return true;
        }
        
        // Check for React DevTools
        if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
          return true;
        }
        
        // Check for Next.js
        if (typeof window !== 'undefined' && (window as any).__NEXT_DATA__) {
          return true;
        }
        
        return false;
      }, { timeout: 5000 });
    } catch (error) {
      // React not detected, continue anyway
      this.logger.debug('React not detected, continuing without hydration wait');
    }
  }

  /**
   * Wait for dynamic content to load
   */
  private async waitForDynamicContent(page: Page): Promise<void> {
    try {
      // Wait for network to be idle
      await page.waitForFunction(() => {
        return new Promise((resolve) => {
          let pendingRequests = 0;
          let timeout: NodeJS.Timeout;

          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'resource') {
                const resourceEntry = entry as PerformanceResourceTiming;
                if (resourceEntry.initiatorType === 'fetch' || resourceEntry.initiatorType === 'xmlhttprequest') {
                  pendingRequests++;
                  clearTimeout(timeout);
                  
                  timeout = setTimeout(() => {
                    if (pendingRequests === 0) {
                      observer.disconnect();
                      resolve(true);
                    }
                  }, 1000);
                }
              }
            }
          });

          observer.observe({ entryTypes: ['resource'] });

          // Fallback timeout
          setTimeout(() => {
            observer.disconnect();
            resolve(true);
          }, 3000);
        });
      }, { timeout: 10000 });
    } catch (error) {
      // Dynamic content wait failed, continue anyway
      this.logger.debug('Dynamic content wait failed, continuing');
    }
  }

  /**
   * Check if page has loaded successfully
   */
  async isPageLoaded(page: Page): Promise<boolean> {
    try {
      const readyState = await page.evaluate(() => document.readyState);
      return readyState === 'complete';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get page performance metrics
   */
  async getPerformanceMetrics(page: Page): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstPaint: number;
    firstContentfulPaint: number;
  }> {
    try {
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        const firstPaint = paint.find(entry => entry.name === 'first-paint');
        const firstContentfulPaint = paint.find(entry => entry.name === 'first-contentful-paint');
        
        return {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: firstPaint ? firstPaint.startTime : 0,
          firstContentfulPaint: firstContentfulPaint ? firstContentfulPaint.startTime : 0,
        };
      });

      return metrics;
    } catch (error) {
      this.logger.warn('Failed to get performance metrics');
      return {
        loadTime: 0,
        domContentLoaded: 0,
        firstPaint: 0,
        firstContentfulPaint: 0,
      };
    }
  }

  /**
   * Take a screenshot of the page (for debugging)
   */
  async takeScreenshot(page: Page, filePath: string): Promise<void> {
    try {
      await page.screenshot({
        path: filePath,
        fullPage: true,
      });
      this.logger.debug(`Screenshot saved to: ${filePath}`);
    } catch (error) {
      this.logger.warn(`Failed to take screenshot: ${error}`);
    }
  }
}
