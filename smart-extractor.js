#!/usr/bin/env node

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

/**
 * Smart Content Extractor
 * Automatically chooses between HTTP and browser extraction based on website type
 */

class SmartExtractor {
  constructor(config = {}) {
    this.config = {
      siteUrl: config.siteUrl || 'https://example.com',
      outputDir: config.outputDir || './content',
      forceBrowser: config.forceBrowser || false,
      forceHttp: config.forceHttp || false,
      ...config
    };
  }

  async extract() {
    console.log('🚀 Starting smart content extraction...');
    console.log(`📄 Extracting from: ${this.config.siteUrl}`);

    try {
      // First, try HTTP extraction to check if it's a static site
      if (!this.config.forceBrowser) {
        console.log('🔍 Checking if HTTP extraction is sufficient...');
        const httpResult = await this.tryHttpExtraction();
        
        if (httpResult.success && httpResult.content.length > 0) {
          console.log('✅ HTTP extraction successful! Using HTTP method.');
          return httpResult;
        } else {
          console.log('⚠️  HTTP extraction found no content. Switching to browser extraction...');
        }
      }

      // Use browser extraction
      console.log('🌐 Using browser extraction for JavaScript-heavy content...');
      return await this.browserExtraction();

    } catch (error) {
      console.error('❌ Extraction failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

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
      const title = this.extractTitle(html);
      const content = this.parseContent(html, title);

      if (content.length === 0) {
        return { success: false, content: [] };
      }

      // Create output directory
      await fs.ensureDir(this.config.outputDir);

      // Write markdown file
      const markdown = this.convertToMarkdown(content, title, 'HTTP');
      const outputPath = path.join(this.config.outputDir, 'extracted-content.md');
      await fs.writeFile(outputPath, markdown, 'utf-8');

      // Create README
      const readme = this.createReadme(title, 'HTTP');
      const readmePath = path.join(this.config.outputDir, 'README.md');
      await fs.writeFile(readmePath, readme, 'utf-8');

      return {
        success: true,
        title,
        content,
        outputPath,
        readmePath,
        method: 'HTTP'
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

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
      
      // Set viewport and user agent
      await page.setViewport({ width: 1200, height: 800 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      // Navigate to page
      console.log('📄 Loading page...');
      await page.goto(this.config.siteUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for content to load
      console.log('⏳ Waiting for content to load...');
      await new Promise(resolve => setTimeout(resolve, 3000));

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
      const markdown = this.convertToMarkdown(content, title, 'Browser');
      const outputPath = path.join(this.config.outputDir, 'extracted-content.md');
      await fs.writeFile(outputPath, markdown, 'utf-8');

      // Create README
      const readme = this.createReadme(title, 'Browser');
      const readmePath = path.join(this.config.outputDir, 'README.md');
      await fs.writeFile(readmePath, readme, 'utf-8');

      return {
        success: true,
        title,
        content,
        outputPath,
        readmePath,
        method: 'Browser'
      };

    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  }

  extractTitle(html) {
    const $ = cheerio.load(html);
    return $('title').text().trim() || 'Untitled Page';
  }

  parseContent(html, title) {
    const $ = cheerio.load(html);
    const content = [];

    // Remove script, style, and other non-content elements
    $('script, style, noscript, iframe, embed, object, applet, form, nav, header, footer, aside').remove();

    // Check if this is a JavaScript-heavy site
    const hasReactRoot = $('#root').length > 0;
    const hasVueRoot = $('#app').length > 0;
    const hasAngularRoot = $('[ng-app]').length > 0;
    
    if (hasReactRoot || hasVueRoot || hasAngularRoot) {
      console.log('⚠️  Detected JavaScript framework (React/Vue/Angular)');
    }

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

    // Extract divs with substantial text content (for browser extraction)
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

  convertToMarkdown(content, title, method) {
    let markdown = `# ${title}\n\n`;
    markdown += `<!-- Content extracted from: ${this.config.siteUrl} -->\n`;
    markdown += `<!-- Extracted at: ${new Date().toISOString()} -->\n`;
    markdown += `<!-- Method: ${method} ${method === 'HTTP' ? '(no browser)' : '(Puppeteer)'} -->\n\n`;

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

  createReadme(title, method) {
    const methodDescription = method === 'HTTP' 
      ? 'HTTP Request (fast, lightweight)' 
      : 'Browser Automation (handles JavaScript)';

    return `# Smart Content Extractor - Extracted Content

**Source Site:** ${this.config.siteUrl}
**Page Title:** ${title}
**Extracted:** ${new Date().toISOString()}
**Method:** ${methodDescription}

## About This Content

This content was automatically extracted from the website using the Smart Content Extractor. The system automatically chose the best extraction method based on the website's structure.

## Files

- \`extracted-content.md\` - The main extracted content in Markdown format
- \`README.md\` - This file with extraction information

## Editing Instructions

1. Edit the content in \`extracted-content.md\`
2. Maintain the structure and formatting
3. The metadata comments at the top should not be removed
4. Save your changes

## Extraction Method Used

**${method} Extraction:**
${method === 'HTTP' 
  ? '- ✅ Fast and lightweight\n- ✅ No browser dependencies\n- ✅ Perfect for static websites\n- ❌ Cannot handle JavaScript-rendered content'
  : '- ✅ Handles JavaScript-heavy websites\n- ✅ Extracts dynamically loaded content\n- ✅ Works with React, Vue, Angular\n- ⚠️  Requires browser automation (slower)'
}

---
Generated by Smart Content Extractor
`;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node smart-extractor.js <url> [output-dir]');
    console.log('Example: node smart-extractor.js https://example.com ./my-content');
    console.log('');
    console.log('Options:');
    console.log('  <url>        The website URL to extract content from');
    console.log('  [output-dir] Output directory (default: ./content)');
    console.log('');
    console.log('This extractor automatically chooses between HTTP and browser extraction.');
    process.exit(1);
  }

  const url = args[0];
  const outputDir = args[1] || './content';

  const extractor = new SmartExtractor({
    siteUrl: url,
    outputDir
  });

  extractor.extract().then(result => {
    if (result.success) {
      console.log('');
      console.log(`✅ Extraction completed using ${result.method} method!`);
      console.log(`📁 Output directory: ${result.outputDir}`);
      console.log(`📄 Content extracted: ${result.content.length} pieces`);
      console.log('');
      console.log('📖 Next steps:');
      console.log('1. Review the extracted content in the output directory');
      console.log('2. Edit the markdown files as needed');
      console.log('3. The content is ready for use!');
    } else {
      console.error('❌ Extraction failed:', result.error);
      process.exit(1);
    }
  });
}

module.exports = SmartExtractor;
