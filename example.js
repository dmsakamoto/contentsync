#!/usr/bin/env node

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

/**
 * Simple Content Sync Utility Example
 * This demonstrates the core functionality without the full TypeScript setup
 */

class SimpleContentSync {
  constructor(config = {}) {
    this.config = {
      siteUrl: config.siteUrl || 'https://example.com',
      outputDir: config.outputDir || './content',
      headless: config.headless !== false,
      waitTime: config.waitTime || 2000,
      ...config
    };
  }

  async extract() {
    console.log('🚀 Starting content extraction...');
    console.log(`📄 Extracting from: ${this.config.siteUrl}`);

    try {
      // Launch browser
      const browser = await puppeteer.launch({
        headless: this.config.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Set viewport
      await page.setViewport({ width: 1200, height: 800 });

      // Navigate to page
      console.log('🌐 Loading page...');
      await page.goto(this.config.siteUrl, { waitUntil: 'networkidle2' });

      // Wait for content to load
      if (this.config.waitTime > 0) {
        await page.waitForTimeout(this.config.waitTime);
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
      return {
        success: false,
        error: error.message
      };
    }
  }

  parseContent(html, title) {
    const $ = cheerio.load(html);
    const content = [];

    // Remove script and style tags
    $('script, style, noscript').remove();

    // Find main content areas
    const contentSelectors = ['main', '[role="main"]', 'article', '.content', '.post-content'];
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

    return content;
  }

  isNavigationElement($element) {
    const className = $element.attr('class') || '';
    const id = $element.attr('id') || '';
    const role = $element.attr('role') || '';

    const navKeywords = ['nav', 'navigation', 'menu', 'navbar', 'header', 'footer', 'sidebar'];
    
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
    markdown += `<!-- Extracted at: ${new Date().toISOString()} -->\n\n`;

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
      }
    }

    return markdown;
  }

  createReadme(title) {
    return `# Content Sync - Extracted Content

**Source Site:** ${this.config.siteUrl}
**Page Title:** ${title}
**Extracted:** ${new Date().toISOString()}

## About This Content

This content was automatically extracted from the website using the Content Sync Utility.

## Files

- \`extracted-content.md\` - The main extracted content in Markdown format
- \`README.md\` - This file with extraction information

## Editing Instructions

1. Edit the content in \`extracted-content.md\`
2. Maintain the structure and formatting
3. The metadata comments at the top should not be removed
4. Save your changes

## Next Steps

After editing the content, you can use the sync functionality to update the website (when implemented).

---
Generated by Content Sync Utility
`;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node example.js <url> [output-dir]');
    console.log('Example: node example.js https://example.com ./my-content');
    process.exit(1);
  }

  const url = args[0];
  const outputDir = args[1] || './content';

  const extractor = new SimpleContentSync({
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
      console.log('3. Use the sync command to update the website');
    } else {
      process.exit(1);
    }
  });
}

module.exports = SimpleContentSync;
