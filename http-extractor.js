#!/usr/bin/env node

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

/**
 * Simple HTTP Content Extractor
 * Extracts content from websites using HTTP requests (no browser needed)
 */

class HttpExtractor {
  constructor(config = {}) {
    this.config = {
      siteUrl: config.siteUrl || 'https://example.com',
      outputDir: config.outputDir || './content',
      userAgent: config.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      timeout: config.timeout || 10000,
      ...config
    };
  }

  async extract() {
    console.log('🚀 Starting HTTP content extraction...');
    console.log(`📄 Extracting from: ${this.config.siteUrl}`);

    try {
      // Fetch the page content
      console.log('🌐 Fetching page content...');
      const response = await fetch(this.config.siteUrl, {
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: this.config.timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const title = this.extractTitle(html);

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

  extractTitle(html) {
    const $ = cheerio.load(html);
    return $('title').text().trim() || 'Untitled Page';
  }

  parseContent(html, title) {
    const $ = cheerio.load(html);
    const content = [];

    // Remove script, style, and other non-content elements
    $('script, style, noscript, iframe, embed, object, applet, form, nav, header, footer, aside').remove();

    // Find main content areas
    const contentSelectors = ['main', '[role="main"]', 'article', '.content', '.post-content', '.main-content', '#content', '#main'];
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
    markdown += `<!-- Method: HTTP Request (no browser) -->\n\n`;

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
      }
    }

    return markdown;
  }

  createReadme(title) {
    return `# HTTP Content Extractor - Extracted Content

**Source Site:** ${this.config.siteUrl}
**Page Title:** ${title}
**Extracted:** ${new Date().toISOString()}
**Method:** HTTP Request (no browser automation)

## About This Content

This content was automatically extracted from the website using the HTTP Content Extractor. This method uses direct HTTP requests and doesn't require browser automation, making it faster and more reliable for static content.

## Files

- \`extracted-content.md\` - The main extracted content in Markdown format
- \`README.md\` - This file with extraction information

## Editing Instructions

1. Edit the content in \`extracted-content.md\`
2. Maintain the structure and formatting
3. The metadata comments at the top should not be removed
4. Save your changes

## Advantages of HTTP Extraction

- ✅ **Faster**: No browser startup time
- ✅ **Lighter**: No browser dependencies
- ✅ **More Reliable**: Fewer moving parts
- ✅ **Better for Static Content**: Perfect for most websites
- ✅ **No JavaScript Rendering**: Extracts server-rendered content

## Limitations

- ❌ **No JavaScript Rendering**: Won't extract dynamically loaded content
- ❌ **No Interactive Elements**: Can't handle complex SPAs
- ❌ **Limited to Static Content**: Best for traditional websites

---
Generated by HTTP Content Extractor
`;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node http-extractor.js <url> [output-dir]');
    console.log('Example: node http-extractor.js https://example.com ./my-content');
    console.log('');
    console.log('Options:');
    console.log('  <url>        The website URL to extract content from');
    console.log('  [output-dir] Output directory (default: ./content)');
    console.log('');
    console.log('This extractor uses HTTP requests and is perfect for static websites.');
    process.exit(1);
  }

  const url = args[0];
  const outputDir = args[1] || './content';

  const extractor = new HttpExtractor({
    siteUrl: url,
    outputDir,
    timeout: 10000
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

module.exports = HttpExtractor;
