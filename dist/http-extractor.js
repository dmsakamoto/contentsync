"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExtractor = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const cheerio = __importStar(require("cheerio"));
class HttpExtractor {
    constructor(config) {
        this.config = {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
                    'User-Agent': this.config.userAgent || '',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const html = await response.text();
            const title = this.extractTitle(html);
            // Parse content
            console.log('📝 Parsing content...');
            const content = this.parseContent(html);
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
                content
            };
        }
        catch (error) {
            console.error('❌ Extraction failed:', error);
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
            return {
                success: false,
                error: errorMessage
            };
        }
    }
    extractTitle(html) {
        const $ = cheerio.load(html);
        const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled Page';
        return title;
    }
    parseContent(html) {
        const $ = cheerio.load(html);
        const content = [];
        // Remove script and style tags
        $('script, style, noscript').remove();
        // Find main content areas
        const contentSelectors = ['main', '[role="main"]', 'article', '.content', '.post-content'];
        let $contentArea = null;
        for (const selector of contentSelectors) {
            $contentArea = $(selector).first();
            if ($contentArea.length > 0)
                break;
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
                    text
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
                    text
                });
            }
        });
        // Extract lists
        $contentArea.find('ul, ol').each((i, element) => {
            const $element = $(element);
            const items = [];
            $element.find('li').each((j, li) => {
                const text = $(li).text().trim();
                if (text)
                    items.push(text);
            });
            if (items.length > 0 && !this.isNavigationElement($element)) {
                content.push({
                    type: 'list',
                    text: items.join('\n'),
                    items
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
        if (role === 'navigation')
            return true;
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
        markdown += `<!-- Method: HTTP Request (no JavaScript rendering) -->\n\n`;
        for (const item of content) {
            switch (item.type) {
                case 'heading':
                    const hashes = '#'.repeat(item.level || 1);
                    markdown += `${hashes} ${item.text}\n\n`;
                    break;
                case 'paragraph':
                    markdown += `${item.text}\n\n`;
                    break;
                case 'list':
                    if (item.items) {
                        for (const listItem of item.items) {
                            markdown += `- ${listItem}\n`;
                        }
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
**Method:** HTTP Request (no JavaScript rendering)

## About This Content

This content was automatically extracted from the website using the Content Sync Utility via HTTP request. This method works for static content but may not capture JavaScript-rendered content.

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
exports.HttpExtractor = HttpExtractor;
