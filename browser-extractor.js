#!/usr/bin/env node

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

/**
 * Browser-Based Content Extractor
 * Extracts content from JavaScript-heavy websites using Puppeteer
 */

class BrowserExtractor {
  constructor(config = {}) {
    this.config = {
      siteUrl: config.siteUrl || 'https://example.com',
      outputDir: config.outputDir || './content',
      headless: config.headless !== false,
      waitTime: config.waitTime || 3000,
      viewport: config.viewport || { width: 1200, height: 800 },
      userAgent: config.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      ...config
    };
  }

  async extract() {
    console.log('🚀 Starting browser-based content extraction...');
    console.log(`📄 Extracting from: ${this.config.siteUrl}`);

    let browser;
    try {
      // Launch browser
      console.log('🌐 Launching browser...');
      browser = await puppeteer.launch({
        headless: this.config.headless ? 'new' : false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Set viewport and user agent
      await page.setViewport(this.config.viewport);
      await page.setUserAgent(this.config.userAgent);

      // Navigate to page
      console.log('📄 Loading page...');
      await page.goto(this.config.siteUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for content to load
      if (this.config.waitTime > 0) {
        console.log(`⏳ Waiting ${this.config.waitTime}ms for content to load...`);
        await new Promise(resolve => setTimeout(resolve, this.config.waitTime));
      }

      // Get page content
      const title = await page.title();
      const html = await page.content();

      await browser.close();

      // Parse content
      console.log('📝 Parsing content...');
      const content = this.parseContent(html, title);

      // Create output directory
      await fs.ensureDir(this.config.outputDir);

      // Write markdown file
      const markdown = this.convertToMarkdown(content, title);
      const outputPath = path.join(this.config.outputDir, 'extracted-content.md');
      await fs.writeFile(outputPath, markdown, 'utf-8');

      // Create README
      const readme = this.createReadme(title);
      const readmePath = path.join(this.config.outputDir, 'README.md');
      await fs.writeFile(readmePath, readme, 'utf-8');

      console.log('✅ Extraction completed successfully!');
      console.log(`📁 Output directory: ${this.config.outputDir}`);
      console.log(`📄 Content extracted: ${content.length} pieces`);

      return {
        success: true,
        title,
        content,
        outputPath,
        readmePath
      };

    } catch (error) {
      console.error('❌ Extraction failed:', error.message);
      if (browser) {
        await browser.close();
      }
      return {
        success: false,
        error: error.message
      };
    }
  }

  parseContent(html, title) {
    const $ = cheerio.load(html);
    const content = [];

    // Remove script, style, and other non-content elements
    $('script, style, noscript, iframe, embed, object, applet, form, nav, header, footer, aside').remove();

    // Find main content areas
    const contentSelectors = [
      'main', 
      '[role="main"]', 
      'article', 
      '.content', 
      '.post-content', 
      '.main-content', 
      '#content', 
      '#main',
      '.container',
      '.wrapper',
      '.page-content',
      '.site-content',
      '#root', // For React apps
      '#app'   // For Vue apps
    ];
    let $contentArea = null;

    for (const selector of contentSelectors) {
      $contentArea = $(selector).first();
      if ($contentArea.length > 0) break;
    }

    if (!$contentArea || $contentArea.length === 0) {
      // Fallback to body
      $contentArea = $('body');
    }

    // Extract headings
    $contentArea.find('h1, h2, h3, h4, h5, h6').each((i, element) => {
      const $element = $(element);
      const text = $element.text().trim();
      if (text) {
        content.push({
          type: 'heading',
          level: parseInt(element.tagName.charAt(1)),
          text,
          tag: element.tagName.toLowerCase()
        });
      }
    });

    // Extract paragraphs
    $contentArea.find('p').each((i, element) => {
      const $element = $(element);
      const text = $element.text().trim();
      if (text && !this.isNavigationElement($element)) {
        content.push({
          type: 'paragraph',
          text,
          tag: 'p'
        });
      }
    });

    // Extract lists
    $contentArea.find('ul, ol').each((i, element) => {
      const $element = $(element);
      const items = [];
      $element.find('li').each((j, li) => {
        const text = $(li).text().trim();
        if (text) items.push(text);
      });
      
      if (items.length > 0 && !this.isNavigationElement($element)) {
        content.push({
          type: 'list',
          items,
          tag: element.tagName.toLowerCase()
        });
      }
    });

    // Extract blockquotes
    $contentArea.find('blockquote').each((i, element) => {
      const $element = $(element);
      const text = $element.text().trim();
      if (text && !this.isNavigationElement($element)) {
        content.push({
          type: 'blockquote',
          text,
          tag: 'blockquote'
        });
      }
    });

    // Extract code blocks
    $contentArea.find('pre, code').each((i, element) => {
      const $element = $(element);
      const text = $element.text().trim();
      if (text && !this.isNavigationElement($element)) {
        content.push({
          type: 'code',
          text,
          tag: element.tagName.toLowerCase()
        });
      }
    });

    // Extract divs with substantial text content
    $contentArea.find('div').each((i, element) => {
      const $element = $(element);
      const text = $element.text().trim();
      
      // Only extract divs with substantial text content
      if (text.length > 50 && !this.isNavigationElement($element)) {
        // Check if this div doesn't contain other extracted elements
        const hasExtractedChildren = $element.find('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre, code').length > 0;
        
        if (!hasExtractedChildren) {
          content.push({
            type: 'div',
            text,
            tag: 'div'
          });
        }
      }
    });

    return content;
  }

  isNavigationElement($element) {
    const className = $element.attr('class') || '';
    const id = $element.attr('id') || '';
    const role = $element.attr('role') || '';

    const navKeywords = ['nav', 'navigation', 'menu', 'navbar', 'header', 'footer', 'sidebar', 'breadcrumb'];
    
    if (role === 'navigation') return true;
    
    for (const keyword of navKeywords) {
      if (className.toLowerCase().includes(keyword) || id.toLowerCase().includes(keyword)) {
        return true;
      }
    }

    return false;
  }

  convertToMarkdown(content, title) {
    let markdown = `# ${title}\n\n`;
    markdown += `<!-- Content extracted from: ${this.config.siteUrl} -->\n`;
    markdown += `<!-- Extracted at: ${new Date().toISOString()} -->\n`;
    markdown += `<!-- Method: Browser Automation (Puppeteer) -->\n\n`;

    for (const item of content) {
      switch (item.type) {
        case 'heading':
          const hashes = '#'.repeat(item.level);
          markdown += `${hashes} ${item.text}\n\n`;
          break;
        
        case 'paragraph':
          markdown += `${item.text}\n\n`;
          break;
        
        case 'list':
          for (const listItem of item.items) {
            markdown += `- ${listItem}\n`;
          }
          markdown += '\n';
          break;

        case 'blockquote':
          markdown += `> ${item.text}\n\n`;
          break;

        case 'code':
          if (item.tag === 'pre') {
            markdown += '```\n';
            markdown += `${item.text}\n`;
            markdown += '```\n\n';
          } else {
            markdown += `\`${item.text}\`\n\n`;
          }
          break;

        case 'div':
          markdown += `${item.text}\n\n`;
          break;
      }
    }

    return markdown;
  }

  createReadme(title) {
    return `# Browser Content Extractor - Extracted Content

**Source Site:** ${this.config.siteUrl}
**Page Title:** ${title}
**Extracted:** ${new Date().toISOString()}
**Method:** Browser Automation (Puppeteer)

## About This Content

This content was automatically extracted from the website using the Browser Content Extractor. This method uses browser automation to render JavaScript-heavy websites and extract dynamically loaded content.

## Files

- \`extracted-content.md\` - The main extracted content in Markdown format
- \`README.md\` - This file with extraction information

## Editing Instructions

1. Edit the content in \`extracted-content.md\`
2. Maintain the structure and formatting
3. The metadata comments at the top should not be removed
4. Save your changes

## Advantages of Browser Extraction

- ✅ **JavaScript Rendering**: Handles React, Vue, Angular, and other SPAs
- ✅ **Dynamic Content**: Extracts content loaded via AJAX/fetch
- ✅ **Complete Content**: Gets all rendered content, not just initial HTML
- ✅ **Interactive Elements**: Can handle user-triggered content loading

## Requirements

- Requires Puppeteer (browser automation)
- Slightly slower than HTTP extraction
- More resource-intensive

---
Generated by Browser Content Extractor
`;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node browser-extractor.js <url> [output-dir]');
    console.log('Example: node browser-extractor.js https://example.com ./my-content');
    console.log('');
    console.log('Options:');
    console.log('  <url>        The website URL to extract content from');
    console.log('  [output-dir] Output directory (default: ./content)');
    console.log('');
    console.log('This extractor uses browser automation and can handle JavaScript-heavy websites.');
    process.exit(1);
  }

  const url = args[0];
  const outputDir = args[1] || './content';

  const extractor = new BrowserExtractor({
    siteUrl: url,
    outputDir,
    headless: true,
    waitTime: 3000
  });

  extractor.extract().then(result => {
    if (result.success) {
      console.log('\n📖 Next steps:');
      console.log('1. Review the extracted content in the output directory');
      console.log('2. Edit the markdown files as needed');
      console.log('3. The content is ready for use!');
    } else {
      process.exit(1);
    }
  });
}

module.exports = BrowserExtractor;
