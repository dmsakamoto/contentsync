const fetch = require('node-fetch');
const fs = require('fs-extra');
const path = require('path');
const ContentUtils = require('./utils');

/**
 * HTTP-based content extraction
 */

class HttpExtractor {
  constructor(config = {}) {
    this.config = config;
    this.utils = new ContentUtils();
  }

  /**
   * Try HTTP extraction for static content
   */
  async tryHttpExtraction() {
    try {
      const response = await fetch(this.config.siteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const title = this.utils.extractTitle(html);
      const content = this.utils.parseContent(html, title);

      if (content.length === 0) {
        return { success: false, content: [] };
      }

      // Create output directory
      await fs.ensureDir(this.config.outputDir);

      // Write markdown file
      const markdown = this.utils.convertToMarkdown(content, this.config.siteUrl, 'HTTP');
      const outputPath = path.join(this.config.outputDir, 'extracted-content.md');
      await fs.writeFile(outputPath, markdown, 'utf-8');

      // Create README
      const readme = this.utils.createReadme(title, 'HTTP', this.config.siteUrl);
      const readmePath = path.join(this.config.outputDir, 'README.md');
      await fs.writeFile(readmePath, readme, 'utf-8');

      return {
        success: true,
        title,
        content,
        outputPath,
        readmePath,
        method: 'HTTP',
        outputDir: this.config.outputDir
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract content from a specific URL using HTTP
   */
  async extractFromUrl(url) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.config.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const title = this.utils.extractTitle(html);
      const content = this.utils.parseContent(html, title);

      return {
        success: true,
        title,
        content,
        method: 'HTTP'
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = HttpExtractor; 
