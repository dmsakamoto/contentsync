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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleExtractor = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const cheerio = __importStar(require("cheerio"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class SimpleExtractor {
    constructor(config) {
        this.config = {
            headless: true,
            waitTime: 2000,
            ...config
        };
    }
    async extract() {
        console.log('🚀 Starting content extraction...');
        console.log(`📄 Extracting from: ${this.config.siteUrl}`);
        try {
            // Launch browser
            console.log('🔧 Launching browser...');
            const browser = await puppeteer_1.default.launch({
                headless: this.config.headless ? 'new' : false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            }).catch(error => {
                console.error('Failed to launch browser:', error);
                throw new Error(`Browser launch failed: ${error.message}`);
            });
            const page = await browser.newPage();
            // Set viewport
            await page.setViewport({ width: 1200, height: 800 });
            // Navigate to page
            console.log('🌐 Loading page...');
            await page.goto(this.config.siteUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 15000
            });
            // Wait for content to load
            if (this.config.waitTime && this.config.waitTime > 0) {
                await page.waitForTimeout(this.config.waitTime);
            }
            // Get page content
            const title = await page.title();
            const html = await page.content();
            await browser.close();
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
        markdown += `<!-- Extracted at: ${new Date().toISOString()} -->\n\n`;
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
exports.SimpleExtractor = SimpleExtractor;
