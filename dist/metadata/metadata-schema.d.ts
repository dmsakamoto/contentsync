export type ContentType = 'heading' | 'paragraph' | 'list' | 'link' | 'image' | 'blockquote' | 'code' | 'table' | 'div' | 'section';
export interface ContentMetadata {
    contentId: string;
    selector: string;
    xpath?: string;
    parentId?: string;
    contentType: ContentType;
    extractedAt: Date;
    sourceUrl: string;
    componentContext?: string;
    textContent: string;
    htmlContent?: string;
    attributes?: Record<string, string>;
    position?: {
        x: number;
        y: number;
    };
}
export interface PageMetadata {
    url: string;
    title: string;
    extractedAt: Date;
    contentCount: number;
    contentIds: string[];
    filePath?: string;
}
export interface ExtractionMetadata {
    siteUrl: string;
    extractedAt: Date;
    pages: PageMetadata[];
    contentMap: Record<string, ContentMetadata>;
    settings: ExtractionSettings;
    version: string;
}
export interface ExtractionSettings {
    contentSelectors: string[];
    excludeSelectors: string[];
    waitForSelector?: string;
    waitTime: number;
    fileStructure: 'pages' | 'components' | 'hybrid';
}
export interface SyncMetadata {
    previousExtractionId: string;
    syncType: 'initial' | 'content-only' | 'structure' | 'full-resync';
    changes: {
        added: string[];
        modified: string[];
        removed: string[];
    };
    timestamp: Date;
}
export interface ContentHierarchy {
    id: string;
    type: ContentType;
    level: number;
    children: ContentHierarchy[];
    metadata: ContentMetadata;
}
//# sourceMappingURL=metadata-schema.d.ts.map