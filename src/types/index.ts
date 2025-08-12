// Re-export all types from their respective modules
export * from '../config/schema';
export * from '../metadata/metadata-schema';

// Additional shared types
export interface ExtractionResult {
  success: boolean;
  metadata: ExtractionMetadata;
  errors: ExtractionError[];
  warnings: string[];
  processingTime: number;
}

export interface ExtractionError {
  type: 'page-render' | 'content-parse' | 'file-write' | 'network' | 'browser';
  message: string;
  url?: string;
  timestamp: Date;
  details?: any;
}

export interface RenderedPage {
  url: string;
  title: string;
  html: string;
  renderedAt: Date;
  loadTime: number;
  errors: string[];
}

export interface ParsedContent {
  pageUrl: string;
  title: string;
  content: ContentMetadata[];
  hierarchy: ContentHierarchy[];
  extractedAt: Date;
}

export interface FileOutput {
  filePath: string;
  content: string;
  metadata: ContentMetadata[];
}

export interface ProgressInfo {
  current: number;
  total: number;
  currentUrl: string;
  stage: 'discovery' | 'rendering' | 'parsing' | 'writing';
  errors: number;
  warnings: number;
}

export interface Logger {
  info(message: string, metadata?: any): void;
  warn(message: string, metadata?: any): void;
  error(message: string, metadata?: any): void;
  debug(message: string, metadata?: any): void;
}

export interface ExtractionLog {
  level: 'info' | 'warn' | 'error';
  timestamp: Date;
  page?: string;
  component: string;
  message: string;
  metadata?: any;
}
