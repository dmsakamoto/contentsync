import * as cheerio from 'cheerio';
import { ContentType } from '../types';
import { ContentIdentifier } from './content-identifier';
export interface ExtractedText {
    text: string;
    html: string;
    type: ContentType;
    attributes: Record<string, string>;
}
export declare class TextExtractor {
    private contentIdentifier;
    constructor(contentIdentifier: ContentIdentifier);
    /**
     * Extract text content from a content area
     */
    extractFromContentArea($contentArea: cheerio.Cheerio<cheerio.Element>): ExtractedText[];
    /**
     * Extract headings from content area
     */
    private extractHeadings;
    /**
     * Extract other content elements (paragraphs, lists, etc.)
     */
    private extractOtherContent;
    /**
     * Clean and normalize text content
     */
    private cleanText;
    /**
     * Extract attributes from an element
     */
    private extractAttributes;
    /**
     * Extract links from content
     */
    extractLinks($contentArea: cheerio.Cheerio<cheerio.Element>): ExtractedText[];
    /**
     * Extract images from content
     */
    extractImages($contentArea: cheerio.Cheerio<cheerio.Element>): ExtractedText[];
    /**
     * Get the content type based on element tag
     */
    getContentType(tagName: string): ContentType;
}
//# sourceMappingURL=text-extractor.d.ts.map