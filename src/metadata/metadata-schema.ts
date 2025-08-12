export type ContentType = 'heading' | 'paragraph' | 'list' | 'link' | 'image' | 'blockquote' | 'code' | 'table' | 'div' | 'section';

export interface ContentMetadata {
  contentId: string; // Stable identifier
  selector: string; // CSS selector to find element
  xpath?: string; // Backup XPath selector
  parentId?: string; // Hierarchical relationship
  contentType: ContentType; // heading, paragraph, list, etc.
  extractedAt: Date;
  sourceUrl: string;
  componentContext?: string; // React component hint
  textContent: string; // The actual text content
  htmlContent?: string; // Original HTML if needed
  attributes?: Record<string, string>; // Element attributes
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
  filePath?: string; // Where the markdown file is saved
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
  level: number; // Heading level or nesting level
  children: ContentHierarchy[];
  metadata: ContentMetadata;
}
