import * as cheerio from 'cheerio';
import { ContentSelectionConfig } from '../types';
export interface ContentArea {
    element: cheerio.Cheerio<cheerio.Element>;
    selector: string;
    score: number;
    type: 'main' | 'article' | 'section' | 'div';
}
export declare class ContentIdentifier {
    private config;
    constructor(config: ContentSelectionConfig);
    /**
     * Find main content areas in the HTML
     */
    findContentAreas(html: string): ContentArea[];
    /**
     * Calculate a score for how likely an element is to contain main content
     */
    private calculateContentScore;
    /**
     * Check if an element is likely navigation
     */
    private isNavigationElement;
    /**
     * Get the type of element based on selector
     */
    private getElementType;
    /**
     * Filter out overlapping content areas
     */
    private filterOverlappingAreas;
    /**
     * Check if two elements overlap
     */
    private areElementsOverlapping;
    /**
     * Get the best content area (highest scoring non-overlapping area)
     */
    getBestContentArea(html: string): ContentArea | null;
    /**
     * Check if an element should be excluded based on configuration
     */
    shouldExcludeElement($element: cheerio.Cheerio<cheerio.Element>): boolean;
}
//# sourceMappingURL=content-identifier.d.ts.map