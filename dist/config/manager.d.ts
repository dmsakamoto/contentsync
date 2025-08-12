import { ExtractionConfig } from './schema';
export declare class ConfigManager {
    private config;
    constructor(config?: Partial<ExtractionConfig>);
    /**
     * Load configuration from a file
     */
    static loadFromFile(configPath: string): Promise<ConfigManager>;
    /**
     * Create default configuration file
     */
    static createDefaultConfig(outputPath: string): Promise<void>;
    /**
     * Merge user config with defaults
     */
    private mergeWithDefaults;
    /**
     * Validate the configuration
     */
    validate(): string[];
    /**
     * Get the full configuration
     */
    getConfig(): ExtractionConfig;
    /**
     * Get specific configuration sections
     */
    getBrowserConfig(): {
        headless: boolean;
        viewport: {
            width: number;
            height: number;
        };
        userAgent: string | undefined;
    };
    getProcessingConfig(): {
        waitForSelector: string | undefined;
        waitTime: number;
        maxConcurrency: number;
    };
    getOutputConfig(): {
        outputDir: string;
        fileStructure: "pages" | "components" | "hybrid";
        generateReadme: boolean;
    };
    getContentSelectionConfig(): {
        contentSelectors: string[];
        excludeSelectors: string[];
        includeNavigation: boolean;
    };
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<ExtractionConfig>): void;
}
//# sourceMappingURL=manager.d.ts.map