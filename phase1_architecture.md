# Phase 1 Technical Architecture - Content Sync Utility

## Overview

Phase 1 focuses on building the core extraction engine with a simple CLI interface. The architecture prioritizes reliability, extensibility, and clear separation of concerns to support future sync strategies.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           CLI Interface                          │
├─────────────────────────────────────────────────────────────────┤
│                      Extraction Orchestrator                     │
├─────────────────────────────────────────────────────────────────┤
│  Page Renderer  │  Content Parser  │  Metadata Gen  │  File Mgmt │
├─────────────────────────────────────────────────────────────────┤
│         Config Manager         │         Logger & Utils          │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. CLI Interface (`src/cli/`)

**Purpose:** Entry point for developer interaction
**Responsibilities:**
- Command parsing and validation
- Configuration file loading
- Progress reporting
- Error handling and user feedback

**Key Files:**
```
src/cli/
├── index.ts           # Main CLI entry point
├── commands/
│   ├── extract.ts     # Primary extraction command
│   └── validate.ts    # Configuration validation
├── utils/
│   ├── progress.ts    # Progress bars and logging
│   └── config.ts      # Config file parsing
```

**Command Structure:**
```bash
content-sync extract <url> [options]
  --output <path>          # Output directory (default: ./content)
  --config <config-file>   # Custom configuration
  --pages <urls...>        # Specific pages to extract
  --verbose               # Detailed logging
  --dry-run              # Preview without writing files
```

### 2. Extraction Orchestrator (`src/orchestrator/`)

**Purpose:** Coordinates the entire extraction process
**Responsibilities:**
- Site discovery and page enumeration
- Parallel processing management
- Error recovery and retry logic
- Progress tracking and reporting

**Key Files:**
```
src/orchestrator/
├── index.ts              # Main orchestrator class
├── site-crawler.ts       # Discover all pages
├── page-processor.ts     # Process individual pages
└── extraction-context.ts # Shared context and state
```

**Core Algorithm:**
```typescript
class ExtractionOrchestrator {
  async extract(config: ExtractionConfig): Promise<ExtractionResult> {
    // 1. Initialize browser and context
    // 2. Discover all pages (sitemap, crawling, or explicit list)
    // 3. Process pages in parallel (with concurrency limits)
    // 4. Aggregate results and generate metadata
    // 5. Write files and cleanup
  }
}
```

### 3. Page Renderer (`src/renderer/`)

**Purpose:** Render React/Next.js pages and prepare DOM for analysis
**Responsibilities:**
- Browser automation (Puppeteer)
- Wait for dynamic content loading
- Handle SPAs and client-side routing
- Extract final rendered DOM

**Key Files:**
```
src/renderer/
├── browser-manager.ts    # Browser lifecycle management
├── page-renderer.ts      # Individual page rendering
├── wait-strategies.ts    # Dynamic content waiting logic
└── dom-extractor.ts      # Extract clean DOM tree
```

**Rendering Strategy:**
```typescript
class PageRenderer {
  async render(url: string): Promise<RenderedPage> {
    // 1. Navigate to page
    // 2. Wait for React hydration/mounting
    // 3. Wait for dynamic content (network idle, specific selectors)
    // 4. Extract DOM with metadata
    // 5. Clean up and return structured data
  }
}
```

### 4. Content Parser (`src/parser/`)

**Purpose:** Analyze rendered DOM and extract meaningful content
**Responsibilities:**
- Identify semantic content areas
- Filter out navigation/UI elements
- Extract text with hierarchical structure
- Generate content identifiers

**Key Files:**
```
src/parser/
├── content-identifier.ts  # Identify main content areas
├── semantic-analyzer.ts   # Parse HTML5 semantic structure
├── text-extractor.ts     # Extract and clean text content
├── hierarchy-builder.ts  # Build content hierarchy
└── selectors/
    ├── semantic.ts       # HTML5 semantic selectors
    ├── common-patterns.ts # Common React patterns
    └── exclusions.ts     # Elements to ignore
```

**Content Identification Algorithm:**
```typescript
class ContentParser {
  parse(dom: DOM): ParsedContent {
    // 1. Find main content containers (main, article, [role="main"])
    // 2. Extract headings to build content hierarchy
    // 3. Group related content (heading + following paragraphs)
    // 4. Generate unique, stable IDs for each content piece
    // 5. Filter out common UI patterns (nav, footer, sidebar)
  }
}
```

### 5. Metadata Generator (`src/metadata/`)

**Purpose:** Create mapping between content and DOM elements
**Responsibilities:**
- Generate stable content identifiers
- Create DOM selector mappings
- Track content relationships and hierarchy
- Prepare data for future sync operations

**Key Files:**
```
src/metadata/
├── id-generator.ts       # Generate stable content IDs
├── selector-builder.ts   # Build reliable CSS selectors
├── content-mapper.ts     # Map content to DOM locations
└── metadata-schema.ts    # TypeScript interfaces
```

**Metadata Structure:**
```typescript
interface ContentMetadata {
  contentId: string;           // Stable identifier
  selector: string;            // CSS selector to find element
  xpath?: string;              // Backup XPath selector
  parentId?: string;           // Hierarchical relationship
  contentType: ContentType;    // heading, paragraph, list, etc.
  extractedAt: Date;
  sourceUrl: string;
  componentContext?: string;   // React component hint
}

interface ExtractionMetadata {
  siteUrl: string;
  extractedAt: Date;
  pages: PageMetadata[];
  contentMap: Record<string, ContentMetadata>;
  settings: ExtractionSettings;
}
```

### 6. Markdown Converter (`src/converter/`)

**Purpose:** Convert parsed content to clean Markdown format
**Responsibilities:**
- Convert HTML elements to Markdown syntax
- Preserve content hierarchy and structure
- Embed metadata as comments
- Generate clean, editable output

**Key Files:**
```
src/converter/
├── markdown-converter.ts  # Main conversion logic
├── html-to-markdown.ts   # HTML element conversion
├── metadata-embedder.ts  # Embed mapping metadata
└── formatters/
    ├── headings.ts       # Heading conversion
    ├── lists.ts          # List formatting
    └── links.ts          # Link handling
```

### 7. File System Manager (`src/filesystem/`)

**Purpose:** Organize and write extracted content to disk
**Responsibilities:**
- Create logical directory structure
- Generate appropriate file names
- Write Markdown files with metadata
- Handle file conflicts and overwrites

**Key Files:**
```
src/filesystem/
├── structure-builder.ts  # Create directory structure
├── file-writer.ts       # Write individual files
├── naming-strategy.ts   # Generate file names
└── templates/
    ├── page.md.hbs      # Page template
    └── README.md.hbs    # Repository README
```

## Configuration System

### Configuration Schema (`src/config/schema.ts`)

```typescript
interface ExtractionConfig {
  // Site Configuration
  siteUrl: string;
  pages?: string[];              // Explicit page list
  sitemap?: string;             // Sitemap URL for discovery
  
  // Content Selection
  contentSelectors?: string[];   // Custom content selectors
  excludeSelectors?: string[];   // Elements to ignore
  includeNavigation?: boolean;   // Include nav elements
  
  // Processing Options
  waitForSelector?: string;      // Wait for specific element
  waitTime?: number;            // Fixed wait time (ms)
  maxConcurrency?: number;      // Parallel processing limit
  
  // Output Options
  outputDir: string;
  fileStructure: 'pages' | 'components' | 'hybrid';
  generateReadme?: boolean;
  
  // Browser Options
  headless?: boolean;
  viewport?: { width: number; height: number };
  userAgent?: string;
}
```

### Default Configuration (`content-sync.config.js`)

```javascript
module.exports = {
  siteUrl: process.env.SITE_URL,
  outputDir: './content',
  fileStructure: 'pages',
  maxConcurrency: 3,
  
  contentSelectors: [
    'main',
    '[role="main"]',
    'article',
    '.content',
    '.post-content'
  ],
  
  excludeSelectors: [
    'nav', 'header', 'footer',
    '.navigation', '.sidebar',
    '[role="navigation"]',
    '.ads', '.social-share'
  ],
  
  waitForSelector: 'main',
  waitTime: 2000,
  
  browser: {
    headless: true,
    viewport: { width: 1200, height: 800 }
  }
};
```

## Data Flow

### 1. Initialization Phase
```
CLI → Config Loading → Browser Setup → Site Discovery
```

### 2. Processing Phase  
```
Page Queue → Render Page → Parse Content → Generate Metadata → Convert to Markdown
```

### 3. Output Phase
```
Organize Content → Create File Structure → Write Files → Generate Reports
```

## Error Handling Strategy

### Graceful Degradation
- **Page Render Failure:** Skip page, log error, continue with others
- **Content Parse Error:** Extract what's possible, mark as partial
- **File Write Error:** Retry with alternative names, preserve content

### Recovery Mechanisms
- **Browser Crashes:** Restart browser, resume from last successful page
- **Network Timeouts:** Retry with exponential backoff
- **Memory Issues:** Process pages in smaller batches

### Logging and Debugging
```typescript
interface ExtractionLog {
  level: 'info' | 'warn' | 'error';
  timestamp: Date;
  page?: string;
  component: string;
  message: string;
  metadata?: any;
}
```

## Technology Stack

### Core Dependencies
- **Puppeteer**: Browser automation and rendering
- **Cheerio**: Server-side DOM manipulation and parsing
- **Commander.js**: CLI argument parsing and commands
- **Gray-matter**: Frontmatter parsing for markdown files
- **Turndown**: HTML to Markdown conversion
- **Chalk**: Terminal color output
- **Ora**: Progress spinners and indicators

### Development Dependencies
- **TypeScript**: Type safety and developer experience
- **Jest**: Unit testing framework
- **ESLint/Prettier**: Code formatting and linting
- **Husky**: Git hooks for quality gates

## Testing Strategy

### Unit Tests
- Content identification algorithms
- Metadata generation logic
- Markdown conversion accuracy
- Configuration parsing and validation

### Integration Tests
- Full page rendering and extraction
- File system operations
- Browser automation workflows
- Error handling and recovery

### End-to-End Tests
- Complete extraction workflows on sample React sites
- CLI interface and command execution
- Output file validation and structure verification

## Performance Considerations

### Optimization Strategies
- **Parallel Processing**: Multiple pages simultaneously (with limits)
- **Browser Reuse**: Single browser instance across pages
- **DOM Caching**: Cache parsed DOM for multiple extraction passes
- **Incremental Processing**: Process large sites in chunks

### Resource Management
- **Memory Limits**: Monitor and limit memory usage
- **Browser Cleanup**: Proper page and browser cleanup
- **File Handle Management**: Efficient file operations
- **Network Throttling**: Respect target site performance

## Development Milestones

### Week 1: Foundation
- Project setup and core TypeScript structure
- Basic CLI interface with argument parsing
- Configuration system implementation
- Browser automation setup with Puppeteer

### Week 2: Content Extraction
- Page rendering with dynamic content waiting
- Semantic content identification algorithms
- Text extraction and cleaning utilities
- Initial metadata generation system

### Week 3: Processing Pipeline
- Content parsing and hierarchy building
- Markdown conversion implementation
- File system operations and structure creation
- Error handling and logging framework

### Week 4: Integration & Testing
- End-to-end extraction workflow
- Comprehensive testing suite
- Performance optimization
- Documentation and examples

## Next Phase Integration Points

The Phase 1 architecture is designed to support future sync capabilities:

- **Metadata Schema**: Extensible for sync tracking
- **Content IDs**: Stable across extraction runs
- **Modular Design**: Easy to extend with sync strategies  
- **Error Handling**: Foundation for conflict resolution
- **Configuration**: Extensible for sync-specific settings

This foundation will enable Phase 2 sync management features without major architectural changes.