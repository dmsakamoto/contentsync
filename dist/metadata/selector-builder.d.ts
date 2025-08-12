import * as cheerio from 'cheerio';
export interface SelectorInfo {
    cssSelector: string;
    xpath?: string;
    specificity: number;
    reliability: number;
}
export declare class SelectorBuilder {
    /**
     * Build a reliable CSS selector for an element
     */
    buildSelector($element: cheerio.Cheerio<cheerio.Element>): SelectorInfo;
    /**
     * Build selector using ID attribute
     */
    private buildIdSelector;
    /**
     * Build selector using class attributes
     */
    private buildClassSelector;
    /**
     * Build selector using data attributes
     */
    private buildAttributeSelector;
    /**
     * Build selector using element path
     */
    private buildPathSelector;
    /**
     * Get the element path from root
     */
    private getElementPath;
    /**
     * Build XPath for an element
     */
    private buildXPath;
    /**
     * Find unique classes for an element
     */
    private findUniqueClasses;
    /**
     * Check if a class name is generic
     */
    private isGenericClass;
    /**
     * Check if an ID is valid
     */
    private isValidId;
    /**
     * Test if a selector is unique in the document
     */
    testSelectorUniqueness(selector: string, $root: cheerio.Cheerio<cheerio.Root>): boolean;
    /**
     * Build a more specific selector by adding context
     */
    buildContextualSelector($element: cheerio.Cheerio<cheerio.Element>, contextLevels?: number): SelectorInfo;
}
//# sourceMappingURL=selector-builder.d.ts.map