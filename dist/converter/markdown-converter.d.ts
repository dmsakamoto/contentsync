import { ContentMetadata, ContentType } from '../types';
export interface MarkdownOptions {
    includeMetadata?: boolean;
    metadataFormat?: 'comments' | 'frontmatter';
    preserveLinks?: boolean;
    preserveImages?: boolean;
    headingStyle?: 'atx' | 'setext';
    bulletListMarker?: '-' | '+' | '*';
    codeBlockStyle?: 'fenced' | 'indented';
}
export declare class MarkdownConverter {
    private turndownService;
    private options;
    constructor(options?: MarkdownOptions);
    /**
     * Initialize the Turndown service with custom rules
     */
    private initializeTurndownService;
    /**
     * Add custom conversion rules
     */
    private addCustomRules;
    /**
     * Convert HTML content to Markdown
     */
    convertToMarkdown(html: string): string;
    /**
     * Convert content with metadata to Markdown
     */
    convertWithMetadata(html: string, metadata: ContentMetadata[], pageTitle?: string): string;
    /**
     * Generate frontmatter for the markdown file
     */
    private generateFrontmatter;
    /**
     * Generate metadata comments
     */
    private generateMetadataComments;
    /**
     * Basic HTML to Markdown conversion (fallback)
     */
    private basicHtmlToMarkdown;
    /**
     * Convert a single content piece to markdown
     */
    convertContentPiece(text: string, contentType: ContentType, metadata?: ContentMetadata): string;
    /**
     * Clean up markdown content
     */
    cleanupMarkdown(markdown: string): string;
}
//# sourceMappingURL=markdown-converter.d.ts.map