export interface ExtractionConfig {
  // Site Configuration
  siteUrl: string;
  pages?: string[]; // Explicit page list
  sitemap?: string; // Sitemap URL for discovery

  // Content Selection
  contentSelectors?: string[]; // Custom content selectors
  excludeSelectors?: string[]; // Elements to ignore
  includeNavigation?: boolean; // Include nav elements

  // Processing Options
  waitForSelector?: string; // Wait for specific element
  waitTime?: number; // Fixed wait time (ms)
  maxConcurrency?: number; // Parallel processing limit

  // Output Options
  outputDir: string;
  fileStructure: 'pages' | 'components' | 'hybrid';
  generateReadme?: boolean;

  // Browser Options
  headless?: boolean;
  viewport?: { width: number; height: number };
  userAgent?: string;
}

export interface BrowserConfig {
  headless: boolean;
  viewport: { width: number; height: number };
  userAgent: string;
}

export interface ProcessingConfig {
  waitForSelector?: string;
  waitTime: number;
  maxConcurrency: number;
}

export interface OutputConfig {
  outputDir: string;
  fileStructure: 'pages' | 'components' | 'hybrid';
  generateReadme: boolean;
}

export interface ContentSelectionConfig {
  contentSelectors: string[];
  excludeSelectors: string[];
  includeNavigation: boolean;
}

export const DEFAULT_CONFIG: Partial<ExtractionConfig> = {
  outputDir: './content',
  fileStructure: 'pages',
  maxConcurrency: 3,
  headless: true,
  viewport: { width: 1200, height: 800 },
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  contentSelectors: [
    'main',
    '[role="main"]',
    'article',
    '.content',
    '.post-content',
  ],
  excludeSelectors: [
    'nav',
    'header',
    'footer',
    '.navigation',
    '.sidebar',
    '[role="navigation"]',
    '.ads',
    '.social-share',
  ],
  waitForSelector: 'main',
  waitTime: 2000,
  generateReadme: true,
};
