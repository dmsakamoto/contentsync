"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtractionOrchestrator = void 0;
const browser_manager_1 = require("../renderer/browser-manager");
const page_renderer_1 = require("../renderer/page-renderer");
const content_identifier_1 = require("../parser/content-identifier");
const text_extractor_1 = require("../parser/text-extractor");
const id_generator_1 = require("../metadata/id-generator");
const selector_builder_1 = require("../metadata/selector-builder");
const markdown_converter_1 = require("../converter/markdown-converter");
const structure_builder_1 = require("../filesystem/structure-builder");
const logger_1 = require("../utils/logger");
const progress_1 = require("../utils/progress");
class ExtractionOrchestrator {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger || new logger_1.ConsoleLogger();
        this.progress = new progress_1.ProgressTracker();
        // Initialize components
        this.browserManager = new browser_manager_1.BrowserManager(config.getBrowserConfig(), this.logger);
        this.pageRenderer = new page_renderer_1.PageRenderer(config.getProcessingConfig(), this.logger);
        this.contentIdentifier = new content_identifier_1.ContentIdentifier(config.getContentSelectionConfig());
        this.textExtractor = new text_extractor_1.TextExtractor(this.contentIdentifier);
        this.idGenerator = id_generator_1.IdGenerator.getInstance();
        this.selectorBuilder = new selector_builder_1.SelectorBuilder();
        this.markdownConverter = new markdown_converter_1.MarkdownConverter();
        this.structureBuilder = new structure_builder_1.StructureBuilder(config.outputDir, config.fileStructure);
    }
    /**
     * Main extraction method
     */
    async extract() {
        const startTime = Date.now();
        const errors = [];
        const warnings = [];
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
            const renderedPages = [];
            const pageMetadata = [];
            for (let i = 0; i < pages.length; i++) {
                const url = pages[i];
                this.progress.setCurrentUrl(url);
                try {
                    const renderedPage = await this.processPage(url);
                    if (renderedPage.html) {
                        renderedPages.push(renderedPage);
                    }
                    else {
                        errors.push({
                            type: 'page-render',
                            message: 'Page rendered but no HTML content found',
                            url,
                            timestamp: new Date(),
                        });
                    }
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    errors.push({
                        type: 'page-render',
                        message: errorMessage,
                        url,
                        timestamp: new Date(),
                    });
                    this.progress.addError();
                }
                this.progress.increment();
            }
            // Parse content
            this.progress.setStage('parsing');
            const parsedContent = [];
            for (const renderedPage of renderedPages) {
                try {
                    const parsed = await this.parsePageContent(renderedPage);
                    parsedContent.push(parsed);
                }
                catch (error) {
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
            const fileStructure = await this.structureBuilder.buildStructure(markdownPages, this.config.siteUrl);
            // Create README if requested
            if (this.config.generateReadme) {
                await this.structureBuilder.createReadme(fileStructure, this.config.siteUrl);
            }
            // Generate extraction metadata
            const extractionMetadata = this.generateExtractionMetadata(parsedContent, fileStructure);
            const processingTime = Date.now() - startTime;
            this.progress.succeed(`Extraction completed successfully`);
            return {
                success: errors.length === 0,
                metadata: extractionMetadata,
                errors,
                warnings,
                processingTime,
            };
        }
        catch (error) {
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
        }
        finally {
            // Cleanup
            await this.browserManager.cleanup();
        }
    }
    /**
     * Discover pages to extract
     */
    async discoverPages() {
        const pages = [];
        // Use explicit page list if provided
        if (this.config.pages && this.config.pages.length > 0) {
            pages.push(...this.config.pages);
        }
        else {
            // Start with the main site URL
            pages.push(this.config.siteUrl);
        }
        return pages;
    }
    /**
     * Process a single page
     */
    async processPage(url) {
        const page = await this.browserManager.getPage();
        try {
            const renderedPage = await this.pageRenderer.render(page, url);
            return renderedPage;
        }
        finally {
            await this.browserManager.returnPage(page);
        }
    }
    /**
     * Parse content from a rendered page
     */
    async parsePageContent(renderedPage) {
        // Find content areas
        const contentAreas = this.contentIdentifier.findContentAreas(renderedPage.html);
        if (contentAreas.length === 0) {
            throw new Error('No content areas found on page');
        }
        const allContent = [];
        // Process each content area
        for (const area of contentAreas) {
            const extractedTexts = this.textExtractor.extractFromContentArea(area.element);
            for (const extractedText of extractedTexts) {
                const selectorInfo = this.selectorBuilder.buildSelector(area.element);
                const metadata = {
                    contentId: this.idGenerator.generateContentId(extractedText.text, extractedText.type, renderedPage.url, selectorInfo.cssSelector),
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
    buildContentHierarchy(content) {
        // Simple hierarchy building - can be enhanced later
        const hierarchy = [];
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
            }
            else {
                // Add to current heading's children
                if (hierarchy.length > 0) {
                    hierarchy[hierarchy.length - 1].children.push({
                        id: item.contentId,
                        type: item.contentType,
                        level: currentLevel + 1,
                        children: [],
                        metadata: item,
                    });
                }
                else {
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
    getHeadingLevel(content) {
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
    async convertToMarkdown(parsedContent) {
        const markdownPages = [];
        for (const parsed of parsedContent) {
            // Convert content to markdown
            const markdownContent = this.markdownConverter.convertWithMetadata(this.buildHtmlFromContent(parsed.content), parsed.content, parsed.title);
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
    buildHtmlFromContent(content) {
        let html = '';
        for (const item of content) {
            if (item.htmlContent) {
                html += item.htmlContent;
            }
            else {
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
    getHtmlTag(contentType) {
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
    generateExtractionMetadata(parsedContent, fileStructure) {
        const contentMap = {};
        const pages = [];
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
            siteUrl: this.config.siteUrl,
            extractedAt: new Date(),
            pages,
            contentMap,
            settings: {
                contentSelectors: this.config.contentSelectors || [],
                excludeSelectors: this.config.excludeSelectors || [],
                waitForSelector: this.config.waitForSelector,
                waitTime: this.config.waitTime || 2000,
                fileStructure: this.config.fileStructure,
            },
            version: '1.0.0',
        };
    }
}
exports.ExtractionOrchestrator = ExtractionOrchestrator;
//# sourceMappingURL=extraction-orchestrator.js.map