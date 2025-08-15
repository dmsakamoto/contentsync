const HttpExtractor = require('./http-extractor');
const BrowserExtractor = require('./browser-extractor');
const WebsiteCrawler = require('./crawler');
const LocalProcessor = require('./local-processor');

/**
 * Smart Content Extractor
 * Automatically chooses between HTTP and browser extraction based on website type
 */

class SmartExtractor {
  constructor(config = {}) {
    this.config = {
      siteUrl: config.siteUrl || 'https://example.com',
      inputPath: config.inputPath || null,
      outputDir: config.outputDir || './content',
      forceBrowser: config.forceBrowser || false,
      forceHttp: config.forceHttp || false,
      waitTime: 3000,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      ...config
    };
    this.visitedUrls = new Set();
    this.extractedPages = [];
    
    // Initialize extractors
    this.httpExtractor = new HttpExtractor(this.config);
    this.browserExtractor = new BrowserExtractor(this.config);
    this.crawler = new WebsiteCrawler(this.config);
    this.localProcessor = new LocalProcessor(this.config);
  }

  /**
   * Main extraction method - automatically chooses best method
   */
  async extract() {
    // Check if we're processing local files
    if (this.config.inputPath) {
      return await this.processLocal();
    }

    console.log('🚀 Starting smart content extraction...');
    console.log(`📄 Extracting from: ${this.config.siteUrl}`);

    try {
      // First, try HTTP extraction to check if it's a static site
      if (!this.config.forceBrowser) {
        console.log('🔍 Checking if HTTP extraction is sufficient...');
        const httpResult = await this.httpExtractor.tryHttpExtraction();
        
        if (httpResult.success && httpResult.content.length > 0) {
          console.log('✅ HTTP extraction successful! Using HTTP method.');
          return httpResult;
        } else {
          console.log('⚠️  HTTP extraction found no content. Switching to browser extraction...');
        }
      }

      // Use browser extraction
      console.log('🌐 Using browser extraction for JavaScript-heavy content...');
      return await this.browserExtractor.browserExtraction();

    } catch (error) {
      console.error('❌ Extraction failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract content from a specific URL
   */
  async extractContent(url) {
    try {
      // Try HTTP first
      const httpResult = await this.httpExtractor.extractFromUrl(url);
      
      if (httpResult.success && httpResult.content.length > 0) {
        return httpResult;
      }
      
      // Fall back to browser extraction
      return await this.browserExtractor.extractFromUrl(url);
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Crawl website and extract multiple pages
   */
  async crawlWebsite(baseUrl, outputDir, options = {}) {
    return await this.crawler.crawlWebsite(baseUrl, outputDir, options);
  }

  /**
   * Process local files and directories
   */
  async processLocal(inputPath = null, outputDir = null) {
    return await this.localProcessor.processLocal(inputPath, outputDir);
  }

  /**
   * Force HTTP extraction
   */
  async extractHttp() {
    return await this.httpExtractor.tryHttpExtraction();
  }

  /**
   * Force browser extraction
   */
  async extractBrowser() {
    return await this.browserExtractor.browserExtraction();
  }
}

module.exports = SmartExtractor;
