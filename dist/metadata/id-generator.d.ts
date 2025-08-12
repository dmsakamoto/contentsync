export declare class IdGenerator {
    private static instance;
    private counter;
    private constructor();
    static getInstance(): IdGenerator;
    /**
     * Generate a stable content ID based on content and context
     */
    generateContentId(text: string, contentType: string, url: string, selector?: string): string;
    /**
     * Generate a page ID based on URL
     */
    generatePageId(url: string): string;
    /**
     * Generate a selector-based ID
     */
    generateSelectorId(selector: string, url: string): string;
    /**
     * Generate a hierarchical ID for nested content
     */
    generateHierarchicalId(parentId: string, text: string, contentType: string): string;
    /**
     * Reset the counter (useful for new extraction runs)
     */
    reset(): void;
    /**
     * Generate a unique extraction ID
     */
    generateExtractionId(siteUrl: string, timestamp: Date): string;
    /**
     * Validate if an ID follows the expected format
     */
    isValidId(id: string): boolean;
    /**
     * Extract information from a content ID
     */
    parseContentId(id: string): {
        hash: string;
        counter: number;
    } | null;
    /**
     * Generate a short, readable ID for file names
     */
    generateShortId(text: string, maxLength?: number): string;
}
//# sourceMappingURL=id-generator.d.ts.map