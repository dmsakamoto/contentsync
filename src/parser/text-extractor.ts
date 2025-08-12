import * as cheerio from 'cheerio';
import { ContentMetadata, ContentType } from '../types';
import { ContentIdentifier } from './content-identifier';

export interface ExtractedText {
  text: string;
  html: string;
  type: ContentType;
  attributes: Record<string, string>;
}

export class TextExtractor {
  private contentIdentifier: ContentIdentifier;

  constructor(contentIdentifier: ContentIdentifier) {
    this.contentIdentifier = contentIdentifier;
  }

  /**
   * Extract text content from a content area
   */
  extractFromContentArea($contentArea: cheerio.Cheerio<cheerio.Element>): ExtractedText[] {
    const extracted: ExtractedText[] = [];

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
  private extractHeadings($contentArea: cheerio.Cheerio<cheerio.Element>): ExtractedText[] {
    const headings: ExtractedText[] = [];

    $contentArea.find('h1, h2, h3, h4, h5, h6').each((_, element) => {
      const $element = cheerio.load(element);
      const tagName = element.tagName.toLowerCase();
      const text = this.cleanText($element.text());
      
      if (text.trim()) {
        headings.push({
          text,
          html: $element.html() || '',
          type: 'heading' as ContentType,
          attributes: this.extractAttributes($element),
        });
      }
    });

    return headings;
  }

  /**
   * Extract other content elements (paragraphs, lists, etc.)
   */
  private extractOtherContent($contentArea: cheerio.Cheerio<cheerio.Element>): ExtractedText[] {
    const content: ExtractedText[] = [];

    // Extract paragraphs
    $contentArea.find('p').each((_, element) => {
      const $element = cheerio.load(element);
      const text = this.cleanText($element.text());
      
      if (text.trim() && !this.contentIdentifier.shouldExcludeElement($element)) {
        content.push({
          text,
          html: $element.html() || '',
          type: 'paragraph' as ContentType,
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
          type: 'list' as ContentType,
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
          type: 'blockquote' as ContentType,
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
          type: 'code' as ContentType,
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
          type: 'table' as ContentType,
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
            type: 'div' as ContentType,
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
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim();
  }

  /**
   * Extract attributes from an element
   */
  private extractAttributes($element: cheerio.Cheerio<cheerio.Element>): Record<string, string> {
    const attributes: Record<string, string> = {};
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
  extractLinks($contentArea: cheerio.Cheerio<cheerio.Element>): ExtractedText[] {
    const links: ExtractedText[] = [];

    $contentArea.find('a').each((_, element) => {
      const $element = cheerio.load(element);
      const text = this.cleanText($element.text());
      const href = $element.attr('href');
      
      if (text.trim() && href && !this.contentIdentifier.shouldExcludeElement($element)) {
        links.push({
          text: `${text} (${href})`,
          html: $element.html() || '',
          type: 'link' as ContentType,
          attributes: this.extractAttributes($element),
        });
      }
    });

    return links;
  }

  /**
   * Extract images from content
   */
  extractImages($contentArea: cheerio.Cheerio<cheerio.Element>): ExtractedText[] {
    const images: ExtractedText[] = [];

    $contentArea.find('img').each((_, element) => {
      const $element = cheerio.load(element);
      const src = $element.attr('src');
      const alt = $element.attr('alt') || '';
      
      if (src && !this.contentIdentifier.shouldExcludeElement($element)) {
        images.push({
          text: alt || src,
          html: $element.html() || '',
          type: 'image' as ContentType,
          attributes: this.extractAttributes($element),
        });
      }
    });

    return images;
  }

  /**
   * Get the content type based on element tag
   */
  getContentType(tagName: string): ContentType {
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
