import TurndownService from 'turndown';
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

export class MarkdownConverter {
  private turndownService: TurndownService;
  private options: MarkdownOptions;

  constructor(options: MarkdownOptions = {}) {
    this.options = {
      includeMetadata: true,
      metadataFormat: 'comments',
      preserveLinks: true,
      preserveImages: true,
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      ...options,
    };

    this.initializeTurndownService();
  }

  /**
   * Initialize the Turndown service with custom rules
   */
  private initializeTurndownService(): void {
    this.turndownService = new TurndownService({
      headingStyle: this.options.headingStyle,
      bulletListMarker: this.options.bulletListMarker,
      codeBlockStyle: this.options.codeBlockStyle,
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full',
    });

    // Add custom rules
    this.addCustomRules();
  }

  /**
   * Add custom conversion rules
   */
  private addCustomRules(): void {
    // Preserve data attributes
    this.turndownService.addRule('dataAttributes', {
      filter: (node) => {
        return node.nodeType === 1 && node.hasAttribute('data-');
      },
      replacement: (content, node) => {
        const element = node as HTMLElement;
        const dataAttrs = Array.from(element.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .map(attr => `${attr.name}="${attr.value}"`)
          .join(' ');

        if (dataAttrs) {
          return `<${element.tagName.toLowerCase()} ${dataAttrs}>${content}</${element.tagName.toLowerCase()}>`;
        }

        return content;
      },
    });

    // Handle React components
    this.turndownService.addRule('reactComponents', {
      filter: (node) => {
        return node.nodeType === 1 && 
               (node as HTMLElement).tagName && 
               /^[A-Z]/.test((node as HTMLElement).tagName);
      },
      replacement: (content, node) => {
        const element = node as HTMLElement;
        return `<!-- React Component: ${element.tagName} -->\n${content}\n<!-- End React Component -->`;
      },
    });

    // Preserve role attributes
    this.turndownService.addRule('roleAttributes', {
      filter: (node) => {
        return node.nodeType === 1 && node.hasAttribute('role');
      },
      replacement: (content, node) => {
        const element = node as HTMLElement;
        const role = element.getAttribute('role');
        return `<!-- Role: ${role} -->\n${content}\n<!-- End Role -->`;
      },
    });
  }

  /**
   * Convert HTML content to Markdown
   */
  convertToMarkdown(html: string): string {
    try {
      return this.turndownService.turndown(html);
    } catch (error) {
      console.warn('Turndown conversion failed, falling back to basic conversion:', error);
      return this.basicHtmlToMarkdown(html);
    }
  }

  /**
   * Convert content with metadata to Markdown
   */
  convertWithMetadata(
    html: string,
    metadata: ContentMetadata[],
    pageTitle?: string
  ): string {
    let markdown = '';

    // Add frontmatter if requested
    if (this.options.metadataFormat === 'frontmatter') {
      markdown += this.generateFrontmatter(metadata, pageTitle);
    }

    // Convert HTML to Markdown
    markdown += this.convertToMarkdown(html);

    // Add metadata comments if requested
    if (this.options.includeMetadata && this.options.metadataFormat === 'comments') {
      markdown += this.generateMetadataComments(metadata);
    }

    return markdown;
  }

  /**
   * Generate frontmatter for the markdown file
   */
  private generateFrontmatter(metadata: ContentMetadata[], pageTitle?: string): string {
    const frontmatter: any = {
      title: pageTitle || 'Extracted Content',
      extractedAt: new Date().toISOString(),
      contentCount: metadata.length,
      contentIds: metadata.map(m => m.contentId),
    };

    return `---\n${JSON.stringify(frontmatter, null, 2)}\n---\n\n`;
  }

  /**
   * Generate metadata comments
   */
  private generateMetadataComments(metadata: ContentMetadata[]): string {
    let comments = '\n\n<!-- Content Sync Metadata -->\n';
    comments += `<!-- Extracted: ${new Date().toISOString()} -->\n`;
    comments += `<!-- Content Count: ${metadata.length} -->\n\n`;

    for (const meta of metadata) {
      comments += `<!-- Content ID: ${meta.contentId} -->\n`;
      comments += `<!-- Type: ${meta.contentType} -->\n`;
      comments += `<!-- Selector: ${meta.selector} -->\n`;
      if (meta.xpath) {
        comments += `<!-- XPath: ${meta.xpath} -->\n`;
      }
      comments += `<!-- Source: ${meta.sourceUrl} -->\n`;
      comments += `<!-- Extracted: ${meta.extractedAt.toISOString()} -->\n\n`;
    }

    comments += '<!-- End Content Sync Metadata -->\n';
    return comments;
  }

  /**
   * Basic HTML to Markdown conversion (fallback)
   */
  private basicHtmlToMarkdown(html: string): string {
    return html
      // Headings
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
      // Paragraphs
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      // Bold
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      // Italic
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      // Links
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      // Lists
      .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
      })
      .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
        let counter = 1;
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`) + '\n';
      })
      // Code blocks
      .replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n\n')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      // Blockquotes
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n\n')
      // Remove other HTML tags
      .replace(/<[^>]*>/g, '')
      // Clean up whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * Convert a single content piece to markdown
   */
  convertContentPiece(
    text: string,
    contentType: ContentType,
    metadata?: ContentMetadata
  ): string {
    let markdown = '';

    // Add metadata comment if provided
    if (metadata && this.options.includeMetadata) {
      markdown += `<!-- Content ID: ${metadata.contentId} -->\n`;
      markdown += `<!-- Type: ${metadata.contentType} -->\n`;
      markdown += `<!-- Selector: ${metadata.selector} -->\n`;
    }

    // Convert based on content type
    switch (contentType) {
      case 'heading':
        markdown += `# ${text}\n\n`;
        break;
      case 'paragraph':
        markdown += `${text}\n\n`;
        break;
      case 'list':
        markdown += `${text}\n\n`;
        break;
      case 'blockquote':
        markdown += `> ${text}\n\n`;
        break;
      case 'code':
        markdown += `\`\`\`\n${text}\n\`\`\`\n\n`;
        break;
      case 'link':
        markdown += `${text}\n\n`;
        break;
      case 'image':
        markdown += `![${text}]\n\n`;
        break;
      default:
        markdown += `${text}\n\n`;
    }

    return markdown;
  }

  /**
   * Clean up markdown content
   */
  cleanupMarkdown(markdown: string): string {
    return markdown
      // Remove excessive blank lines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove trailing whitespace
      .replace(/[ \t]+$/gm, '')
      // Ensure proper spacing around headings
      .replace(/([^\n])\n(#+ )/g, '$1\n\n$2')
      // Remove empty metadata comments
      .replace(/<!-- [^>]* -->\s*\n/g, '')
      .trim();
  }
}
