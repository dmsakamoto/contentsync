export interface ExtractionConfig {
    siteUrl: string;
    pages?: string[];
    sitemap?: string;
    contentSelectors?: string[];
    excludeSelectors?: string[];
    includeNavigation?: boolean;
    waitForSelector?: string;
    waitTime?: number;
    maxConcurrency?: number;
    outputDir: string;
    fileStructure: 'pages' | 'components' | 'hybrid';
    generateReadme?: boolean;
    headless?: boolean;
    viewport?: {
        width: number;
        height: number;
    };
    userAgent?: string;
}
export interface BrowserConfig {
    headless: boolean;
    viewport: {
        width: number;
        height: number;
    };
    userAgent: string;
}
export interface ProcessingConfig {
    waitForSelector?: string;
    waitTime: number;
    maxConcurrency: number;
}
export interface OutputConfig {
    outputDir: string;
    fileStructure: 'pages' | 'components' | 'hybrid';
    generateReadme: boolean;
}
export interface ContentSelectionConfig {
    contentSelectors: string[];
    excludeSelectors: string[];
    includeNavigation: boolean;
}
export declare const DEFAULT_CONFIG: Partial<ExtractionConfig>;
//# sourceMappingURL=schema.d.ts.map