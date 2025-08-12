import { ExtractionConfig, ExtractionResult, Logger } from '../types';
export declare class ExtractionOrchestrator {
    private config;
    private logger;
    private progress;
    private browserManager;
    private pageRenderer;
    private contentIdentifier;
    private textExtractor;
    private idGenerator;
    private selectorBuilder;
    private markdownConverter;
    private structureBuilder;
    constructor(config: ExtractionConfig, logger?: Logger);
    /**
     * Main extraction method
     */
    extract(): Promise<ExtractionResult>;
    /**
     * Discover pages to extract
     */
    private discoverPages;
    /**
     * Process a single page
     */
    private processPage;
    /**
     * Parse content from a rendered page
     */
    private parsePageContent;
    /**
     * Build content hierarchy
     */
    private buildContentHierarchy;
    /**
     * Get heading level from content
     */
    private getHeadingLevel;
    /**
     * Convert parsed content to markdown
     */
    private convertToMarkdown;
    /**
     * Build HTML from content metadata for conversion
     */
    private buildHtmlFromContent;
    /**
     * Get HTML tag for content type
     */
    private getHtmlTag;
    /**
     * Generate extraction metadata
     */
    private generateExtractionMetadata;
}
//# sourceMappingURL=extraction-orchestrator.d.ts.map