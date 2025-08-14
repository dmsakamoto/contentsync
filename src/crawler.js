const fs = require('fs-extra');
const path = require('path');
const { URL } = require('url');
const HttpExtractor = require('./http-extractor');
const BrowserExtractor = require('./browser-extractor');
const LinkParser = require('./link-parser');

/**
 * Multi-page website crawling functionality
 */

class WebsiteCrawler {
  constructor(config = {}) {
    this.config = {
      waitTime: 3000,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      ...config
    };
    this.visitedUrls = new Set();
    this.extractedPages = [];
    this.httpExtractor = new HttpExtractor(config);
    this.browserExtractor = new BrowserExtractor(config);
    this.linkParser = new LinkParser(config);
  }

  /**
   * Crawl website and extract multiple pages
   */
  async crawlWebsite(baseUrl, outputDir, options = {}) {
    const {
      depth = 0, // 0 = single page, 1 = main pages, 2+ = specific depth
      filter = [], // Array of patterns to exclude
      maxPages = 50 // Maximum pages to extract
    } = options;

    console.log('🕷️  Starting website crawl...');
    console.log(`📄 Base URL: ${baseUrl}`);
    console.log(`📁 Output directory: ${outputDir}`);
    console.log(`🔍 Crawl depth: ${depth === 0 ? 'Single page' : depth === 1 ? 'Main pages' : `Depth ${depth}`}`);
    
    if (filter.length > 0) {
      console.log(`🚫 Filters: ${filter.join(', ')}`);
    }

    const baseUrlObj = new URL(baseUrl);
    const pagesToExtract = [];
    
    if (depth === 0) {
      // Single page extraction
      pagesToExtract.push({ url: baseUrl, route: '/' });
    } else {
      // Multi-page crawling
      const discoveredPages = await this.discoverPages(baseUrl, depth, filter, maxPages);
      pagesToExtract.push(...discoveredPages);
    }

    console.log(`📋 Found ${pagesToExtract.length} pages to extract`);

    // Extract each page
    for (const page of pagesToExtract) {
      if (this.extractedPages.length >= maxPages) {
        console.log(`⚠️  Reached maximum page limit (${maxPages})`);
        break;
      }

      try {
        console.log(`\n📄 Extracting: ${page.url}`);
        
        // Create a new extractor instance for each page
        const pageConfig = {
          siteUrl: page.url,
          outputDir: path.join(outputDir, 'temp') // Temporary directory
        };
        
        const pageHttpExtractor = new HttpExtractor(pageConfig);
        const pageBrowserExtractor = new BrowserExtractor(pageConfig);
        
        // Try HTTP first, then browser
        let result = await pageHttpExtractor.extractFromUrl(page.url);
        
        if (!result.success || result.content.length === 0) {
          result = await pageBrowserExtractor.extractFromUrl(page.url);
        }
        
        if (result.success && result.content && result.content.length > 0) {
          const fileName = this.linkParser.generateFileName(page.route);
          const filePath = path.join(outputDir, fileName);
          
          // Ensure directory exists for nested routes
          await fs.ensureDir(path.dirname(filePath));
          
          const ContentUtils = require('./utils');
          const utils = new ContentUtils();
          const markdown = utils.convertToMarkdown(result.content, page.url);
          await fs.writeFile(filePath, markdown);
          
          this.extractedPages.push({
            url: page.url,
            route: page.route,
            fileName: fileName,
            contentPieces: result.content.length
          });
          
          console.log(`✅ Extracted: ${fileName} (${result.content.length} pieces)`);
        } else {
          console.log(`⚠️  No content found: ${page.url}`);
        }
      } catch (error) {
        console.log(`❌ Failed to extract ${page.url}: ${error.message}`);
      }
    }

    // Create overview README
    await this.createOverviewReadme(outputDir, baseUrl, this.extractedPages);

    console.log(`\n🎉 Crawl completed!`);
    console.log(`📁 Output directory: ${outputDir}`);
    console.log(`📄 Pages extracted: ${this.extractedPages.length}`);
    
    return this.extractedPages;
  }

  /**
   * Discover pages by following internal links
   */
  async discoverPages(baseUrl, depth, filter, maxPages) {
    const baseUrlObj = new URL(baseUrl);
    const discoveredPages = new Map();
    const pagesToVisit = [{ url: baseUrl, currentDepth: 0 }];
    
    discoveredPages.set(baseUrl, { url: baseUrl, route: '/' });

    while (pagesToVisit.length > 0 && discoveredPages.size < maxPages) {
      const { url, currentDepth } = pagesToVisit.shift();
      
      if (currentDepth >= depth) continue;
      
      try {
        console.log(`🔍 Discovering links on: ${url}`);
        const links = await this.linkParser.extractLinks(url, baseUrlObj);
        
        for (const link of links) {
          if (discoveredPages.size >= maxPages) break;
          
          // Check if page should be filtered out
          if (this.linkParser.shouldFilterPage(link.url, filter)) {
            continue;
          }
          
          if (!discoveredPages.has(link.url)) {
            discoveredPages.set(link.url, link);
            pagesToVisit.push({ 
              url: link.url, 
              currentDepth: currentDepth + 1 
            });
          }
        }
      } catch (error) {
        console.log(`⚠️  Failed to discover links on ${url}: ${error.message}`);
      }
    }

    return Array.from(discoveredPages.values());
  }

  /**
   * Create overview README for multi-page extraction
   */
  async createOverviewReadme(outputDir, baseUrl, extractedPages) {
    const readmeContent = `# Website Content Extraction

## Overview
Content extracted from: ${baseUrl}
Extracted at: ${new Date().toISOString()}
Total pages: ${extractedPages.length}

## Extracted Pages

${extractedPages.map(page => {
  const route = page.route === '/' ? 'Homepage' : page.route;
  return `- **${route}** → \`${page.fileName}\` (${page.contentPieces} content pieces)`;
}).join('\n')}

## Usage
Each markdown file contains the extracted content from the corresponding page.
CSS selectors are included as comments to enable precise content synchronization.

## File Structure
\`\`\`
${outputDir}/
${extractedPages.map(page => `├── ${page.fileName}`).join('\n')}
└── README.md (this file)
\`\`\`

---
Generated by Content Sync Utility
`;

    await fs.writeFile(path.join(outputDir, 'README.md'), readmeContent);
  }
}

module.exports = WebsiteCrawler;
