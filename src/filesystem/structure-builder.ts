import * as path from 'path';
import * as fs from 'fs-extra';
import { URL } from 'url';
import { ContentMetadata, PageMetadata } from '../types';
import { IdGenerator } from '../metadata/id-generator';

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

export class StructureBuilder {
  private outputDir: string;
  private structure: 'pages' | 'components' | 'hybrid';
  private idGenerator: IdGenerator;

  constructor(outputDir: string, structure: 'pages' | 'components' | 'hybrid' = 'pages') {
    this.outputDir = outputDir;
    this.structure = structure;
    this.idGenerator = IdGenerator.getInstance();
  }

  /**
   * Build file structure for extracted content
   */
  async buildStructure(
    pages: Array<{
      url: string;
      title: string;
      content: string;
      metadata: ContentMetadata[];
    }>,
    siteUrl: string
  ): Promise<FileStructure> {
    const fileStructure: FileStructure = {
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
  private async buildPageStructure(
    pages: Array<{
      url: string;
      title: string;
      content: string;
      metadata: ContentMetadata[];
    }>,
    siteUrl: string
  ): Promise<PageFileInfo[]> {
    const pageFiles: PageFileInfo[] = [];

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
  private async buildComponentStructure(
    pages: Array<{
      url: string;
      title: string;
      content: string;
      metadata: ContentMetadata[];
    }>
  ): Promise<ComponentFileInfo[]> {
    const componentFiles: ComponentFileInfo[] = [];
    const componentGroups = new Map<string, { content: string; metadata: ContentMetadata[] }>();

    // Group content by component type
    for (const page of pages) {
      for (const meta of page.metadata) {
        const componentKey = this.getComponentKey(meta);
        
        if (!componentGroups.has(componentKey)) {
          componentGroups.set(componentKey, { content: '', metadata: [] });
        }

        const group = componentGroups.get(componentKey)!;
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
  private async generatePageFilePath(url: string, title: string, siteUrl: string): Promise<string> {
    const urlObj = new URL(url);
    const siteUrlObj = new URL(siteUrl);

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
  private generateFileName(title: string, path: string): string {
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
  private cleanFileName(name: string): string {
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
  private async ensureUniqueFileName(fileName: string, subDir: string): Promise<string> {
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
  private getComponentKey(metadata: ContentMetadata): string {
    // Group by content type and some context
    const type = metadata.contentType;
    const selector = metadata.selector.split(' ')[0]; // Use first part of selector
    
    return `${type}-${selector}`;
  }

  /**
   * Format content for component file
   */
  private formatComponentContent(metadata: ContentMetadata): string {
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
  async createReadme(fileStructure: FileStructure, siteUrl: string): Promise<void> {
    const readmePath = path.join(this.outputDir, 'README.md');
    
    const readme = this.generateReadmeContent(fileStructure, siteUrl);
    await fs.writeFile(readmePath, readme, 'utf-8');
  }

  /**
   * Generate README content
   */
  private generateReadmeContent(fileStructure: FileStructure, siteUrl: string): string {
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
  async getFileStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
  }> {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      fileTypes: {} as Record<string, number>,
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
  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const items = await fs.readdir(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        files.push(...await this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }
}
