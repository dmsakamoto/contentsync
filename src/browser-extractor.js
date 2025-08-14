const fs = require('fs-extra');
const path = require('path');
const ContentUtils = require('./utils');

/**
 * Browser-based content extraction using Puppeteer
 */

class BrowserExtractor {
  constructor(config = {}) {
    this.config = config;
    this.utils = new ContentUtils();
  }

  /**
   * Extract content using browser automation
   */
  async browserExtraction() {
    // Dynamically import Puppeteer to avoid loading it for HTTP-only sites
    const puppeteer = require('puppeteer');
    
    let browser;
    try {
      // Launch browser
      console.log('🌐 Launching browser...');
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Set user agent
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to the page
      console.log('📄 Loading page...');
      await page.goto(this.config.siteUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for content to load
      console.log('⏳ Waiting for content to load...');
      await new Promise(resolve => setTimeout(resolve, this.config.waitTime || 3000));

      // Get the rendered HTML
      console.log('📝 Parsing content...');
      const html = await page.content();
      
      // Close browser
      await browser.close();

      // Parse the content
      const title = this.utils.extractTitle(html);
      const content = this.utils.parseContent(html, title);

      if (content.length === 0) {
        return { success: false, content: [], error: 'No content found' };
      }

      // Create output directory
      await fs.ensureDir(this.config.outputDir);

      // Write markdown file
      const markdown = this.utils.convertToMarkdown(content, this.config.siteUrl, 'Browser');
      const outputPath = path.join(this.config.outputDir, 'extracted-content.md');
      await fs.writeFile(outputPath, markdown, 'utf-8');

      // Create README
      const readme = this.utils.createReadme(title, 'Browser', this.config.siteUrl);
      const readmePath = path.join(this.config.outputDir, 'README.md');
      await fs.writeFile(readmePath, readme, 'utf-8');

      return {
        success: true,
        title,
        content,
        outputPath,
        readmePath,
        method: 'Browser',
        outputDir: this.config.outputDir
      };

    } catch (error) {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          // Ignore close errors
        }
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract content from a specific URL using browser
   */
  async extractFromUrl(url) {
    const puppeteer = require('puppeteer');
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setUserAgent(this.config.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      await new Promise(resolve => setTimeout(resolve, this.config.waitTime || 3000));

      const html = await page.content();
      await browser.close();

      const title = this.utils.extractTitle(html);
      const content = this.utils.parseContent(html, title);

      return {
        success: true,
        title,
        content,
        method: 'Browser'
      };

    } catch (error) {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          // Ignore close errors
        }
      }
      
      return { success: false, error: error.message };
    }
  }
}

module.exports = BrowserExtractor; 
