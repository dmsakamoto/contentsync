import puppeteer, { Browser, Page, LaunchOptions } from 'puppeteer';
import { BrowserConfig } from '../types';
import { Logger } from '../types';

export class BrowserManager {
  private browser: Browser | null = null;
  private config: BrowserConfig;
  private logger: Logger;
  private pagePool: Page[] = [];
  private maxPages: number;

  constructor(config: BrowserConfig, logger: Logger, maxPages = 5) {
    this.config = config;
    this.logger = logger;
    this.maxPages = maxPages;
  }

  /**
   * Initialize the browser
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Launching browser...');
      
      const launchOptions: LaunchOptions = {
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
        ],
      };

      this.browser = await puppeteer.launch(launchOptions);
      
      // Set default viewport
      const pages = await this.browser.pages();
      if (pages.length > 0) {
        await pages[0].setViewport(this.config.viewport);
        if (this.config.userAgent) {
          await pages[0].setUserAgent(this.config.userAgent);
        }
      }

      this.logger.success('Browser launched successfully');
    } catch (error) {
      this.logger.error(`Failed to launch browser: ${error}`);
      throw error;
    }
  }

  /**
   * Get a page from the pool or create a new one
   */
  async getPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    // Return a page from the pool if available
    if (this.pagePool.length > 0) {
      const page = this.pagePool.pop()!;
      try {
        // Clear any existing content
        await page.goto('about:blank');
        return page;
      } catch (error) {
        this.logger.warn('Failed to reuse page from pool, creating new one');
        return this.createNewPage();
      }
    }

    // Create a new page if pool is empty and we haven't reached the limit
    return this.createNewPage();
  }

  /**
   * Create a new page with proper configuration
   */
  private async createNewPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    
    // Configure the page
    await page.setViewport(this.config.viewport);
    if (this.config.userAgent) {
      await page.setUserAgent(this.config.userAgent);
    }

    // Set up request interception to block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Set up error handling
    page.on('error', (error) => {
      this.logger.error(`Page error: ${error.message}`);
    });

    page.on('pageerror', (error) => {
      this.logger.warn(`Page JavaScript error: ${error.message}`);
    });

    return page;
  }

  /**
   * Return a page to the pool for reuse
   */
  async returnPage(page: Page): Promise<void> {
    if (this.pagePool.length < this.maxPages) {
      try {
        // Clear the page content
        await page.goto('about:blank');
        this.pagePool.push(page);
      } catch (error) {
        this.logger.warn('Failed to return page to pool, closing it');
        await this.closePage(page);
      }
    } else {
      // Pool is full, close the page
      await this.closePage(page);
    }
  }

  /**
   * Close a specific page
   */
  private async closePage(page: Page): Promise<void> {
    try {
      await page.close();
    } catch (error) {
      this.logger.warn(`Failed to close page: ${error}`);
    }
  }

  /**
   * Get browser information
   */
  async getBrowserInfo(): Promise<{ version: string; userAgent: string }> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    const version = await this.browser.version();
    const userAgent = await page.evaluate(() => navigator.userAgent);
    await page.close();

    return { version, userAgent };
  }

  /**
   * Check if browser is healthy
   */
  async isHealthy(): Promise<boolean> {
    if (!this.browser) {
      return false;
    }

    try {
      const pages = await this.browser.pages();
      return pages.length > 0;
    } catch (error) {
      this.logger.error(`Browser health check failed: ${error}`);
      return false;
    }
  }

  /**
   * Restart the browser if needed
   */
  async restartIfNeeded(): Promise<void> {
    if (!(await this.isHealthy())) {
      this.logger.warn('Browser is unhealthy, restarting...');
      await this.cleanup();
      await this.initialize();
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up browser resources...');

    // Close all pages in the pool
    for (const page of this.pagePool) {
      await this.closePage(page);
    }
    this.pagePool = [];

    // Close the browser
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        this.logger.success('Browser closed successfully');
      } catch (error) {
        this.logger.error(`Failed to close browser: ${error}`);
      }
    }
  }

  /**
   * Get current pool status
   */
  getPoolStatus(): { total: number; available: number } {
    return {
      total: this.maxPages,
      available: this.pagePool.length,
    };
  }
}
