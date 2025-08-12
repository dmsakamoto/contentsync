"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructureBuilder = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const url_1 = require("url");
const id_generator_1 = require("../metadata/id-generator");
class StructureBuilder {
    constructor(outputDir, structure = 'pages') {
        this.outputDir = outputDir;
        this.structure = structure;
        this.idGenerator = id_generator_1.IdGenerator.getInstance();
    }
    /**
     * Build file structure for extracted content
     */
    async buildStructure(pages, siteUrl) {
        const fileStructure = {
            pages: [],
            components: this.structure !== 'pages' ? [] : undefined,
            metadata: {
                totalPages: pages.length,
                totalComponents: 0,
                totalContent: pages.reduce((sum, page) => sum + page.metadata.length, 0),
                structure: this.structure,
                generatedAt: new Date(),
            },
        };
        // Ensure output directory exists
        await fs.ensureDir(this.outputDir);
        // Create structure based on configuration
        switch (this.structure) {
            case 'pages':
                fileStructure.pages = await this.buildPageStructure(pages, siteUrl);
                break;
            case 'components':
                fileStructure.components = await this.buildComponentStructure(pages);
                fileStructure.metadata.totalComponents = fileStructure.components.length;
                break;
            case 'hybrid':
                fileStructure.pages = await this.buildPageStructure(pages, siteUrl);
                fileStructure.components = await this.buildComponentStructure(pages);
                fileStructure.metadata.totalComponents = fileStructure.components.length;
                break;
        }
        return fileStructure;
    }
    /**
     * Build page-based file structure
     */
    async buildPageStructure(pages, siteUrl) {
        const pageFiles = [];
        for (const page of pages) {
            const filePath = await this.generatePageFilePath(page.url, page.title, siteUrl);
            const fullPath = path.join(this.outputDir, filePath);
            // Ensure directory exists
            await fs.ensureDir(path.dirname(fullPath));
            // Write the file
            await fs.writeFile(fullPath, page.content, 'utf-8');
            pageFiles.push({
                url: page.url,
                title: page.title,
                filePath,
                content: page.content,
                metadata: page.metadata,
            });
        }
        return pageFiles;
    }
    /**
     * Build component-based file structure
     */
    async buildComponentStructure(pages) {
        const componentFiles = [];
        const componentGroups = new Map();
        // Group content by component type
        for (const page of pages) {
            for (const meta of page.metadata) {
                const componentKey = this.getComponentKey(meta);
                if (!componentGroups.has(componentKey)) {
                    componentGroups.set(componentKey, { content: '', metadata: [] });
                }
                const group = componentGroups.get(componentKey);
                group.metadata.push(meta);
                group.content += this.formatComponentContent(meta);
            }
        }
        // Create component files
        for (const [componentKey, group] of componentGroups) {
            const fileName = `${componentKey}.md`;
            const filePath = path.join('components', fileName);
            const fullPath = path.join(this.outputDir, filePath);
            // Ensure directory exists
            await fs.ensureDir(path.dirname(fullPath));
            // Write the file
            await fs.writeFile(fullPath, group.content, 'utf-8');
            componentFiles.push({
                name: componentKey,
                filePath,
                content: group.content,
                metadata: group.metadata,
            });
        }
        return componentFiles;
    }
    /**
     * Generate file path for a page
     */
    async generatePageFilePath(url, title, siteUrl) {
        const urlObj = new url_1.URL(url);
        const siteUrlObj = new url_1.URL(siteUrl);
        // Remove site domain from path
        let relativePath = urlObj.pathname;
        if (relativePath.startsWith(siteUrlObj.pathname)) {
            relativePath = relativePath.substring(siteUrlObj.pathname.length);
        }
        // Handle root path
        if (relativePath === '' || relativePath === '/') {
            relativePath = '/index';
        }
        // Remove trailing slash
        relativePath = relativePath.replace(/\/$/, '');
        // Generate filename from title or path
        let fileName = this.generateFileName(title, relativePath);
        // Ensure unique filename
        fileName = await this.ensureUniqueFileName(fileName, 'pages');
        return path.join('pages', fileName);
    }
    /**
     * Generate filename from title or path
     */
    generateFileName(title, path) {
        // Try to use title first
        if (title && title.trim()) {
            const cleanTitle = this.cleanFileName(title);
            if (cleanTitle) {
                return `${cleanTitle}.md`;
            }
        }
        // Fall back to path
        const pathParts = path.split('/').filter(part => part.trim());
        if (pathParts.length > 0) {
            const lastPart = pathParts[pathParts.length - 1];
            const cleanPath = this.cleanFileName(lastPart);
            return `${cleanPath}.md`;
        }
        // Final fallback
        return 'page.md';
    }
    /**
     * Clean filename for filesystem compatibility
     */
    cleanFileName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim()
            .substring(0, 50); // Limit length
    }
    /**
     * Ensure filename is unique
     */
    async ensureUniqueFileName(fileName, subDir) {
        const baseName = path.basename(fileName, path.extname(fileName));
        const ext = path.extname(fileName);
        let counter = 1;
        let uniqueName = fileName;
        while (await fs.pathExists(path.join(this.outputDir, subDir, uniqueName))) {
            uniqueName = `${baseName}-${counter}${ext}`;
            counter++;
        }
        return uniqueName;
    }
    /**
     * Get component key for grouping
     */
    getComponentKey(metadata) {
        // Group by content type and some context
        const type = metadata.contentType;
        const selector = metadata.selector.split(' ')[0]; // Use first part of selector
        return `${type}-${selector}`;
    }
    /**
     * Format content for component file
     */
    formatComponentContent(metadata) {
        let content = `<!-- Content ID: ${metadata.contentId} -->\n`;
        content += `<!-- Source: ${metadata.sourceUrl} -->\n`;
        content += `<!-- Selector: ${metadata.selector} -->\n\n`;
        content += `${metadata.textContent}\n\n`;
        content += '---\n\n';
        return content;
    }
    /**
     * Create README file for the content structure
     */
    async createReadme(fileStructure, siteUrl) {
        const readmePath = path.join(this.outputDir, 'README.md');
        const readme = this.generateReadmeContent(fileStructure, siteUrl);
        await fs.writeFile(readmePath, readme, 'utf-8');
    }
    /**
     * Generate README content
     */
    generateReadmeContent(fileStructure, siteUrl) {
        let content = `# Content Sync - Extracted Content\n\n`;
        content += `**Source Site:** ${siteUrl}\n`;
        content += `**Extracted:** ${fileStructure.metadata.generatedAt.toISOString()}\n`;
        content += `**Structure:** ${fileStructure.metadata.structure}\n\n`;
        content += `## Summary\n\n`;
        content += `- **Total Pages:** ${fileStructure.metadata.totalPages}\n`;
        content += `- **Total Components:** ${fileStructure.metadata.totalComponents}\n`;
        content += `- **Total Content Pieces:** ${fileStructure.metadata.totalContent}\n\n`;
        if (fileStructure.pages && fileStructure.pages.length > 0) {
            content += `## Pages\n\n`;
            for (const page of fileStructure.pages) {
                content += `- [${page.title}](${page.filePath}) - ${page.url}\n`;
            }
            content += `\n`;
        }
        if (fileStructure.components && fileStructure.components.length > 0) {
            content += `## Components\n\n`;
            for (const component of fileStructure.components) {
                content += `- [${component.name}](${component.filePath}) - ${component.metadata.length} content pieces\n`;
            }
            content += `\n`;
        }
        content += `## Editing Instructions\n\n`;
        content += `1. Edit the content in the markdown files above\n`;
        content += `2. Each content piece has metadata comments showing its source\n`;
        content += `3. Maintain the structure and formatting\n`;
        content += `4. Save changes to update the website content\n\n`;
        content += `## Metadata Format\n\n`;
        content += `Each content piece includes metadata comments:\n`;
        content += `- Content ID: Unique identifier for the content\n`;
        content += `- Type: Content type (heading, paragraph, etc.)\n`;
        content += `- Selector: CSS selector to locate the element\n`;
        content += `- Source: Original page URL\n`;
        content += `- Extracted: Timestamp of extraction\n\n`;
        return content;
    }
    /**
     * Get file statistics
     */
    async getFileStats() {
        const stats = {
            totalFiles: 0,
            totalSize: 0,
            fileTypes: {},
        };
        const files = await this.getAllFiles(this.outputDir);
        for (const file of files) {
            const fileStat = await fs.stat(file);
            const ext = path.extname(file);
            stats.totalFiles++;
            stats.totalSize += fileStat.size;
            stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
        }
        return stats;
    }
    /**
     * Get all files in directory recursively
     */
    async getAllFiles(dir) {
        const files = [];
        const items = await fs.readdir(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = await fs.stat(fullPath);
            if (stat.isDirectory()) {
                files.push(...await this.getAllFiles(fullPath));
            }
            else {
                files.push(fullPath);
            }
        }
        return files;
    }
}
exports.StructureBuilder = StructureBuilder;
//# sourceMappingURL=structure-builder.js.map