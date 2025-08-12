import { ContentMetadata } from '../types';
export interface FileStructure {
    pages: PageFileInfo[];
    components?: ComponentFileInfo[];
    metadata: FileMetadata;
}
export interface PageFileInfo {
    url: string;
    title: string;
    filePath: string;
    content: string;
    metadata: ContentMetadata[];
}
export interface ComponentFileInfo {
    name: string;
    filePath: string;
    content: string;
    metadata: ContentMetadata[];
}
export interface FileMetadata {
    totalPages: number;
    totalComponents: number;
    totalContent: number;
    structure: 'pages' | 'components' | 'hybrid';
    generatedAt: Date;
}
export declare class StructureBuilder {
    private outputDir;
    private structure;
    private idGenerator;
    constructor(outputDir: string, structure?: 'pages' | 'components' | 'hybrid');
    /**
     * Build file structure for extracted content
     */
    buildStructure(pages: Array<{
        url: string;
        title: string;
        content: string;
        metadata: ContentMetadata[];
    }>, siteUrl: string): Promise<FileStructure>;
    /**
     * Build page-based file structure
     */
    private buildPageStructure;
    /**
     * Build component-based file structure
     */
    private buildComponentStructure;
    /**
     * Generate file path for a page
     */
    private generatePageFilePath;
    /**
     * Generate filename from title or path
     */
    private generateFileName;
    /**
     * Clean filename for filesystem compatibility
     */
    private cleanFileName;
    /**
     * Ensure filename is unique
     */
    private ensureUniqueFileName;
    /**
     * Get component key for grouping
     */
    private getComponentKey;
    /**
     * Format content for component file
     */
    private formatComponentContent;
    /**
     * Create README file for the content structure
     */
    createReadme(fileStructure: FileStructure, siteUrl: string): Promise<void>;
    /**
     * Generate README content
     */
    private generateReadmeContent;
    /**
     * Get file statistics
     */
    getFileStats(): Promise<{
        totalFiles: number;
        totalSize: number;
        fileTypes: Record<string, number>;
    }>;
    /**
     * Get all files in directory recursively
     */
    private getAllFiles;
}
//# sourceMappingURL=structure-builder.d.ts.map