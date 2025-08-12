import { BrowserManager } from '../renderer/browser-manager';
import { PageRenderer } from '../renderer/page-renderer';
import { ContentIdentifier } from '../parser/content-identifier';
import { TextExtractor } from '../parser/text-extractor';
import { IdGenerator } from '../metadata/id-generator';
import { SelectorBuilder } from '../metadata/selector-builder';
import { MarkdownConverter } from '../converter/markdown-converter';
import { StructureBuilder } from '../filesystem/structure-builder';
import { ConfigManager } from '../config/manager';
import { ConsoleLogger } from '../utils/logger';
import { ProgressTracker } from '../utils/progress';
import {
  ExtractionConfig,
  ExtractionResult,
  ExtractionError,
  RenderedPage,
  ParsedContent,
  ContentMetadata,
  PageMetadata,
  Logger,
} from '../types';

export class ExtractionOrchestrator {
  private config: ConfigManager;
  private logger: Logger;
  private progress: ProgressTracker;
  private browserManager: BrowserManager;
  private pageRenderer: PageRenderer;
  private contentIdentifier: ContentIdentifier;
  private textExtractor: TextExtractor;
  private idGenerator: IdGenerator;
  private selectorBuilder: SelectorBuilder;
  private markdownConverter: MarkdownConverter;
  private structureBuilder: StructureBuilder;

  constructor(config: ConfigManager, logger?: Logger) {
    this.config = config;
    this.logger = logger || new ConsoleLogger();
    this.progress = new ProgressTracker();
    
    const configData = config.getConfig();
    
    // Initialize components
    this.browserManager = new BrowserManager(
      config.getBrowserConfig(),
      this.logger
    );
    
    this.pageRenderer = new PageRenderer(
      config.getProcessingConfig(),
      this.logger
    );
    
    this.contentIdentifier = new ContentIdentifier(
      config.getContentSelectionConfig()
    );
    
    this.textExtractor = new TextExtractor(this.contentIdentifier);
    this.idGenerator = IdGenerator.getInstance();
    this.selectorBuilder = new SelectorBuilder();
    this.markdownConverter = new MarkdownConverter();
    this.structureBuilder = new StructureBuilder(
      configData.outputDir,
      configData.fileStructure
    );
  }

  /**
   * Main extraction method
   */
  async extract(): Promise<ExtractionResult> {
    const startTime = Date.now();
    const errors: ExtractionError[] = [];
    const warnings: string[] = [];
    const config = this.config.getConfig();

    try {
      this.logger.info('Starting content extraction...');
      this.progress.start('Initializing extraction process');

      // Initialize browser
      await this.browserManager.initialize();

      // Discover pages
      this.progress.setStage('discovery');
      const pages = await this.discoverPages();
      this.progress.setTotal(pages.length);

      if (pages.length === 0) {
        throw new Error('No pages found to extract');
      }

      this.logger.info(`Found ${pages.length} pages to process`);

      // Process pages
      this.progress.setStage('rendering');
      const renderedPages: RenderedPage[] = [];
      const pageMetadata: PageMetadata[] = [];

      for (let i = 0; i < pages.length; i++) {
        const url = pages[i];
        if (url) {
          this.progress.setCurrentUrl(url);

          try {
            const renderedPage = await this.processPage(url);
            if (renderedPage.html) {
              renderedPages.push(renderedPage);
            } else {
              errors.push({
                type: 'page-render',
                message: 'Page rendered but no HTML content found',
                url,
                timestamp: new Date(),
              });
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            errors.push({
              type: 'page-render',
              message: errorMessage,
              url,
              timestamp: new Date(),
            });
            this.progress.addError();
          }
        }

        this.progress.increment();
      }

      // Parse content
      this.progress.setStage('parsing');
      const parsedContent: ParsedContent[] = [];

      for (const renderedPage of renderedPages) {
        try {
          const parsed = await this.parsePageContent(renderedPage);
          parsedContent.push(parsed);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push({
            type: 'content-parse',
            message: errorMessage,
            url: renderedPage.url,
            timestamp: new Date(),
          });
          this.progress.addError();
        }
      }

      // Convert to markdown and write files
      this.progress.setStage('writing');
      const markdownPages = await this.convertToMarkdown(parsedContent);

      // Build file structure
      const fileStructure = await this.structureBuilder.buildStructure(
        markdownPages,
        config.siteUrl
      );

      // Create README if requested
      if (config.generateReadme) {
        await this.structureBuilder.createReadme(fileStructure, config.siteUrl);
      }

      // Generate extraction metadata
      const extractionMetadata = this.generateExtractionMetadata(
        parsedContent,
        fileStructure
      );

      const processingTime = Date.now() - startTime;

      this.progress.succeed(`Extraction completed successfully`);

      return {
        success: errors.length === 0,
        metadata: extractionMetadata,
        errors,
        warnings,
        processingTime,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.progress.fail(`Extraction failed: ${errorMessage}`);
      
      errors.push({
        type: 'browser',
        message: errorMessage,
        timestamp: new Date(),
      });

      return {
        success: false,
        metadata: {
          siteUrl: this.config.siteUrl,
          extractedAt: new Date(),
          pages: [],
          contentMap: {},
          settings: {
            contentSelectors: this.config.contentSelectors || [],
            excludeSelectors: this.config.excludeSelectors || [],
            waitForSelector: this.config.waitForSelector,
            waitTime: this.config.waitTime || 2000,
            fileStructure: this.config.fileStructure,
          },
          version: '1.0.0',
        },
        errors,
        warnings,
        processingTime: Date.now() - startTime,
      };
    } finally {
      // Cleanup
      await this.browserManager.cleanup();
    }
  }

  /**
   * Discover pages to extract
   */
  private async discoverPages(): Promise<string[]> {
    const config = this.config.getConfig();
    const pages: string[] = [];

    // Use explicit page list if provided
    if (config.pages && config.pages.length > 0) {
      pages.push(...config.pages);
    } else {
      // Start with the main site URL
      pages.push(config.siteUrl);
    }

    return pages;
  }

  /**
   * Process a single page
   */
  private async processPage(url: string): Promise<RenderedPage> {
    const page = await this.browserManager.getPage();
    
    try {
      const renderedPage = await this.pageRenderer.render(page, url);
      return renderedPage;
    } finally {
      await this.browserManager.returnPage(page);
    }
  }

  /**
   * Parse content from a rendered page
   */
  private async parsePageContent(renderedPage: RenderedPage): Promise<ParsedContent> {
    // Find content areas
    const contentAreas = this.contentIdentifier.findContentAreas(renderedPage.html);
    
    if (contentAreas.length === 0) {
      throw new Error('No content areas found on page');
    }

    const allContent: ContentMetadata[] = [];

    // Process each content area
    for (const area of contentAreas) {
      const extractedTexts = this.textExtractor.extractFromContentArea(area.element);
      
      for (const extractedText of extractedTexts) {
        const selectorInfo = this.selectorBuilder.buildSelector(area.element);
        
        const metadata: ContentMetadata = {
          contentId: this.idGenerator.generateContentId(
            extractedText.text,
            extractedText.type,
            renderedPage.url,
            selectorInfo.cssSelector
          ),
          selector: selectorInfo.cssSelector,
          xpath: selectorInfo.xpath,
          contentType: extractedText.type,
          extractedAt: new Date(),
          sourceUrl: renderedPage.url,
          textContent: extractedText.text,
          htmlContent: extractedText.html,
          attributes: extractedText.attributes,
        };

        allContent.push(metadata);
      }
    }

    return {
      pageUrl: renderedPage.url,
      title: renderedPage.title,
      content: allContent,
      hierarchy: this.buildContentHierarchy(allContent),
      extractedAt: new Date(),
    };
  }

  /**
   * Build content hierarchy
   */
  private buildContentHierarchy(content: ContentMetadata[]): any[] {
    // Simple hierarchy building - can be enhanced later
    const hierarchy: any[] = [];
    let currentLevel = 0;

    for (const item of content) {
      if (item.contentType === 'heading') {
        // Determine heading level from selector or content
        const level = this.getHeadingLevel(item);
        currentLevel = level;
        
        hierarchy.push({
          id: item.contentId,
          type: item.contentType,
          level,
          children: [],
          metadata: item,
        });
      } else {
        // Add to current heading's children
        if (hierarchy.length > 0) {
          hierarchy[hierarchy.length - 1].children.push({
            id: item.contentId,
            type: item.contentType,
            level: currentLevel + 1,
            children: [],
            metadata: item,
          });
        } else {
          // No heading, add at root level
          hierarchy.push({
            id: item.contentId,
            type: item.contentType,
            level: 1,
            children: [],
            metadata: item,
          });
        }
      }
    }

    return hierarchy;
  }

  /**
   * Get heading level from content
   */
  private getHeadingLevel(content: ContentMetadata): number {
    // Try to extract level from selector
    const headingMatch = content.selector.match(/h([1-6])/i);
    if (headingMatch) {
      return parseInt(headingMatch[1], 10);
    }

    // Default to level 1
    return 1;
  }

  /**
   * Convert parsed content to markdown
   */
  private async convertToMarkdown(parsedContent: ParsedContent[]): Promise<Array<{
    url: string;
    title: string;
    content: string;
    metadata: ContentMetadata[];
  }>> {
    const markdownPages: Array<{
      url: string;
      title: string;
      content: string;
      metadata: ContentMetadata[];
    }> = [];

    for (const parsed of parsedContent) {
      // Convert content to markdown
      const markdownContent = this.markdownConverter.convertWithMetadata(
        this.buildHtmlFromContent(parsed.content),
        parsed.content,
        parsed.title
      );

      markdownPages.push({
        url: parsed.pageUrl,
        title: parsed.title,
        content: this.markdownConverter.cleanupMarkdown(markdownContent),
        metadata: parsed.content,
      });
    }

    return markdownPages;
  }

  /**
   * Build HTML from content metadata for conversion
   */
  private buildHtmlFromContent(content: ContentMetadata[]): string {
    let html = '';

    for (const item of content) {
      if (item.htmlContent) {
        html += item.htmlContent;
      } else {
        // Fallback to basic HTML
        const tag = this.getHtmlTag(item.contentType);
        html += `<${tag}>${item.textContent}</${tag}>`;
      }
    }

    return html;
  }

  /**
   * Get HTML tag for content type
   */
  private getHtmlTag(contentType: string): string {
    switch (contentType) {
      case 'heading': return 'h1';
      case 'paragraph': return 'p';
      case 'list': return 'ul';
      case 'blockquote': return 'blockquote';
      case 'code': return 'pre';
      case 'link': return 'a';
      case 'image': return 'img';
      default: return 'div';
    }
  }

  /**
   * Generate extraction metadata
   */
  private generateExtractionMetadata(
    parsedContent: ParsedContent[],
    fileStructure: any
  ): any {
    const config = this.config.getConfig();
    const contentMap: Record<string, ContentMetadata> = {};
    const pages: PageMetadata[] = [];

    // Build content map
    for (const parsed of parsedContent) {
      for (const content of parsed.content) {
        contentMap[content.contentId] = content;
      }

      pages.push({
        url: parsed.pageUrl,
        title: parsed.title,
        extractedAt: parsed.extractedAt,
        contentCount: parsed.content.length,
        contentIds: parsed.content.map(c => c.contentId),
      });
    }

    return {
      siteUrl: config.siteUrl,
      extractedAt: new Date(),
      pages,
      contentMap,
      settings: {
        contentSelectors: config.contentSelectors || [],
        excludeSelectors: config.excludeSelectors || [],
        waitForSelector: config.waitForSelector,
        waitTime: config.waitTime || 2000,
        fileStructure: config.fileStructure,
      },
      version: '1.0.0',
    };
  }
}
