"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdGenerator = void 0;
const crypto_1 = require("crypto");
class IdGenerator {
    constructor() {
        this.counter = 0;
    }
    static getInstance() {
        if (!IdGenerator.instance) {
            IdGenerator.instance = new IdGenerator();
        }
        return IdGenerator.instance;
    }
    /**
     * Generate a stable content ID based on content and context
     */
    generateContentId(text, contentType, url, selector) {
        // Create a hash of the content and context
        const content = `${text.trim()}-${contentType}-${url}`;
        const hash = (0, crypto_1.createHash)('md5').update(content).digest('hex').substring(0, 8);
        // Add a counter to ensure uniqueness within the same extraction
        this.counter++;
        return `content-${hash}-${this.counter}`;
    }
    /**
     * Generate a page ID based on URL
     */
    generatePageId(url) {
        const urlHash = (0, crypto_1.createHash)('md5').update(url).digest('hex').substring(0, 8);
        return `page-${urlHash}`;
    }
    /**
     * Generate a selector-based ID
     */
    generateSelectorId(selector, url) {
        const selectorHash = (0, crypto_1.createHash)('md5').update(`${selector}-${url}`).digest('hex').substring(0, 8);
        return `selector-${selectorHash}`;
    }
    /**
     * Generate a hierarchical ID for nested content
     */
    generateHierarchicalId(parentId, text, contentType) {
        const contentHash = (0, crypto_1.createHash)('md5').update(text.trim()).digest('hex').substring(0, 4);
        return `${parentId}-${contentType}-${contentHash}`;
    }
    /**
     * Reset the counter (useful for new extraction runs)
     */
    reset() {
        this.counter = 0;
    }
    /**
     * Generate a unique extraction ID
     */
    generateExtractionId(siteUrl, timestamp) {
        const timestampStr = timestamp.toISOString().replace(/[:.]/g, '-');
        const urlHash = (0, crypto_1.createHash)('md5').update(siteUrl).digest('hex').substring(0, 8);
        return `extraction-${urlHash}-${timestampStr}`;
    }
    /**
     * Validate if an ID follows the expected format
     */
    isValidId(id) {
        const patterns = [
            /^content-[a-f0-9]{8}-\d+$/,
            /^page-[a-f0-9]{8}$/,
            /^selector-[a-f0-9]{8}$/,
            /^extraction-[a-f0-9]{8}-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/,
        ];
        return patterns.some(pattern => pattern.test(id));
    }
    /**
     * Extract information from a content ID
     */
    parseContentId(id) {
        const match = id.match(/^content-([a-f0-9]{8})-(\d+)$/);
        if (match) {
            return {
                hash: match[1],
                counter: parseInt(match[2], 10),
            };
        }
        return null;
    }
    /**
     * Generate a short, readable ID for file names
     */
    generateShortId(text, maxLength = 20) {
        // Remove special characters and convert to lowercase
        const cleanText = text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .trim();
        // Truncate if too long
        if (cleanText.length <= maxLength) {
            return cleanText;
        }
        // Try to truncate at word boundaries
        const words = cleanText.split('-');
        let result = '';
        for (const word of words) {
            if ((result + '-' + word).length <= maxLength) {
                result = result ? result + '-' + word : word;
            }
            else {
                break;
            }
        }
        return result || cleanText.substring(0, maxLength);
    }
}
exports.IdGenerator = IdGenerator;
//# sourceMappingURL=id-generator.js.map