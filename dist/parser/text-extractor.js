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
exports.TextExtractor = void 0;
const cheerio = __importStar(require("cheerio"));
class TextExtractor {
    constructor(contentIdentifier) {
        this.contentIdentifier = contentIdentifier;
    }
    /**
     * Extract text content from a content area
     */
    extractFromContentArea($contentArea) {
        const extracted = [];
        // Extract headings first to establish hierarchy
        const headings = this.extractHeadings($contentArea);
        extracted.push(...headings);
        // Extract other content elements
        const otherContent = this.extractOtherContent($contentArea);
        extracted.push(...otherContent);
        return extracted;
    }
    /**
     * Extract headings from content area
     */
    extractHeadings($contentArea) {
        const headings = [];
        $contentArea.find('h1, h2, h3, h4, h5, h6').each((_, element) => {
            const $element = cheerio.load(element);
            const tagName = element.tagName.toLowerCase();
            const text = this.cleanText($element.text());
            if (text.trim()) {
                headings.push({
                    text,
                    html: $element.html() || '',
                    type: 'heading',
                    attributes: this.extractAttributes($element),
                });
            }
        });
        return headings;
    }
    /**
     * Extract other content elements (paragraphs, lists, etc.)
     */
    extractOtherContent($contentArea) {
        const content = [];
        // Extract paragraphs
        $contentArea.find('p').each((_, element) => {
            const $element = cheerio.load(element);
            const text = this.cleanText($element.text());
            if (text.trim() && !this.contentIdentifier.shouldExcludeElement($element)) {
                content.push({
                    text,
                    html: $element.html() || '',
                    type: 'paragraph',
                    attributes: this.extractAttributes($element),
                });
            }
        });
        // Extract lists
        $contentArea.find('ul, ol').each((_, element) => {
            const $element = cheerio.load(element);
            const text = this.cleanText($element.text());
            if (text.trim() && !this.contentIdentifier.shouldExcludeElement($element)) {
                content.push({
                    text,
                    html: $element.html() || '',
                    type: 'list',
                    attributes: this.extractAttributes($element),
                });
            }
        });
        // Extract blockquotes
        $contentArea.find('blockquote').each((_, element) => {
            const $element = cheerio.load(element);
            const text = this.cleanText($element.text());
            if (text.trim() && !this.contentIdentifier.shouldExcludeElement($element)) {
                content.push({
                    text,
                    html: $element.html() || '',
                    type: 'blockquote',
                    attributes: this.extractAttributes($element),
                });
            }
        });
        // Extract code blocks
        $contentArea.find('pre, code').each((_, element) => {
            const $element = cheerio.load(element);
            const text = this.cleanText($element.text());
            if (text.trim() && !this.contentIdentifier.shouldExcludeElement($element)) {
                content.push({
                    text,
                    html: $element.html() || '',
                    type: 'code',
                    attributes: this.extractAttributes($element),
                });
            }
        });
        // Extract tables
        $contentArea.find('table').each((_, element) => {
            const $element = cheerio.load(element);
            const text = this.cleanText($element.text());
            if (text.trim() && !this.contentIdentifier.shouldExcludeElement($element)) {
                content.push({
                    text,
                    html: $element.html() || '',
                    type: 'table',
                    attributes: this.extractAttributes($element),
                });
            }
        });
        // Extract divs and sections that contain significant text
        $contentArea.find('div, section').each((_, element) => {
            const $element = cheerio.load(element);
            const text = this.cleanText($element.text());
            // Only include divs/sections with substantial text content
            if (text.trim().length > 50 && !this.contentIdentifier.shouldExcludeElement($element)) {
                // Check if this div doesn't contain other extracted elements
                const hasExtractedChildren = $element.find('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre, code, table').length > 0;
                if (!hasExtractedChildren) {
                    content.push({
                        text,
                        html: $element.html() || '',
                        type: 'div',
                        attributes: this.extractAttributes($element),
                    });
                }
            }
        });
        return content;
    }
    /**
     * Clean and normalize text content
     */
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
            .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
            .trim();
    }
    /**
     * Extract attributes from an element
     */
    extractAttributes($element) {
        const attributes = {};
        const element = $element[0];
        if (element && element.attribs) {
            for (const [key, value] of Object.entries(element.attribs)) {
                attributes[key] = value;
            }
        }
        return attributes;
    }
    /**
     * Extract links from content
     */
    extractLinks($contentArea) {
        const links = [];
        $contentArea.find('a').each((_, element) => {
            const $element = cheerio.load(element);
            const text = this.cleanText($element.text());
            const href = $element.attr('href');
            if (text.trim() && href && !this.contentIdentifier.shouldExcludeElement($element)) {
                links.push({
                    text: `${text} (${href})`,
                    html: $element.html() || '',
                    type: 'link',
                    attributes: this.extractAttributes($element),
                });
            }
        });
        return links;
    }
    /**
     * Extract images from content
     */
    extractImages($contentArea) {
        const images = [];
        $contentArea.find('img').each((_, element) => {
            const $element = cheerio.load(element);
            const src = $element.attr('src');
            const alt = $element.attr('alt') || '';
            if (src && !this.contentIdentifier.shouldExcludeElement($element)) {
                images.push({
                    text: alt || src,
                    html: $element.html() || '',
                    type: 'image',
                    attributes: this.extractAttributes($element),
                });
            }
        });
        return images;
    }
    /**
     * Get the content type based on element tag
     */
    getContentType(tagName) {
        switch (tagName.toLowerCase()) {
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
                return 'heading';
            case 'p':
                return 'paragraph';
            case 'ul':
            case 'ol':
                return 'list';
            case 'blockquote':
                return 'blockquote';
            case 'pre':
            case 'code':
                return 'code';
            case 'table':
                return 'table';
            case 'a':
                return 'link';
            case 'img':
                return 'image';
            case 'div':
                return 'div';
            case 'section':
                return 'section';
            default:
                return 'div';
        }
    }
}
exports.TextExtractor = TextExtractor;
//# sourceMappingURL=text-extractor.js.map