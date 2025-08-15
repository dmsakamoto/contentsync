# Content Sync Utility

Extract text content from websites and convert it into editable Markdown files. This enables non-technical clients to edit website copy through GitHub's interface without requiring expensive CMS solutions or technical expertise.

## 🚀 Features

- **Smart Extraction**: Automatically chooses between HTTP and browser extraction methods
- **Multi-Page Crawling**: Extract entire websites with automatic route discovery
- **Dual-Mode Operation**: Fast HTTP extraction for static sites, browser automation for JavaScript-heavy sites
- **Content Ordering**: Preserves natural document flow and hierarchy
- **CSS Selector Generation**: Creates precise selectors for content synchronization
- **Route-Based Organization**: Files named and organized according to website routes
- **Markdown Conversion**: Converts HTML content to clean, editable Markdown format
- **Multiple Content Types**: Extracts headings, paragraphs, lists, blockquotes, and code blocks
- **Navigation Filtering**: Intelligently filters out navigation and non-content elements
- **Simple CLI**: Easy-to-use command-line interface with flexible options
- **Modular Architecture**: Clean, maintainable codebase organized in modules
- **NPM Package**: Can be installed and used as a dependency in other projects

## 📋 Requirements

- Node.js 18.0.0 or higher
- npm or yarn package manager

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd contentsync

# Install dependencies
npm install

# Link globally (optional)
npm link
```

## 🎯 Quick Start

### CLI Usage

#### Single Page Extraction

```bash
# Basic extraction
content-sync https://example.com

# With custom output directory
content-sync https://example.com ./my-content

# Using npm start
npm start https://example.com ./my-content
```

#### Multi-Page Website Crawling

```bash
# Extract main pages only (depth 1)
content-sync https://example.com ./my-content --main

# Crawl to specific depth
content-sync https://example.com ./my-content --depth 3

# Crawl with filters to exclude certain pages
content-sync https://example.com ./my-content --depth 2 --filter admin --filter login

# Limit maximum pages to extract
content-sync https://example.com ./my-content --main --max-pages 10
```

#### Direct Node Usage

```bash
# Run directly with node
node src/cli.js https://example.com ./my-content

# Multi-page crawling with node
node src/cli.js https://example.com ./my-content --main
```

### 📦 Package Usage

content-sync can be used as an npm package in your own applications:

```bash
# Install as dependency
npm install content-sync
```

#### Basic Integration

```javascript
const SmartExtractor = require('content-sync');

// Single page extraction
const extractor = new SmartExtractor({
  siteUrl: 'https://example.com',
  outputDir: './my-content'
});

const result = await extractor.extract();
console.log(`Extracted ${result.content.length} pieces`);
```

#### Multi-Page Crawling

```javascript
const WebsiteCrawler = require('content-sync/src/crawler');

const crawler = new WebsiteCrawler({
  waitTime: 2000,
  userAgent: 'Custom User Agent'
});

await crawler.crawlWebsite('https://example.com', './my-content', {
  depth: 2,
  filter: ['admin', 'login'],
  maxPages: 20
});
```

#### Direct Extraction Methods

```javascript
const HttpExtractor = require('content-sync/src/http-extractor');
const BrowserExtractor = require('content-sync/src/browser-extractor');

// HTTP extraction (fast, static content)
const httpExtractor = new HttpExtractor({
  siteUrl: 'https://example.com',
  outputDir: './my-content'
});
const httpResult = await httpExtractor.extractFromUrl('https://example.com');

// Browser extraction (JavaScript-heavy sites)
const browserExtractor = new BrowserExtractor({
  siteUrl: 'https://example.com',
  outputDir: './my-content'
});
const browserResult = await browserExtractor.extractFromUrl('https://example.com');
```

#### Custom Content Processing

```javascript
const SmartExtractor = require('content-sync');

const extractor = new SmartExtractor({
  siteUrl: 'https://example.com',
  outputDir: './my-content'
});

const result = await extractor.extract();

// Custom processing of extracted content
const processedContent = result.content.map(item => ({
  ...item,
  customField: 'Processed by my app',
  timestamp: new Date().toISOString()
}));

console.log('Processed content:', processedContent);
```

## 📁 Project Structure

```
contentsync/
├── src/                          # Source code directory
│   ├── cli.js                    # Command line interface
│   ├── extractor.js              # Main orchestrator
│   ├── http-extractor.js         # HTTP-based extraction
│   ├── browser-extractor.js      # Browser-based extraction
│   ├── content-parser.js         # HTML content parsing
│   ├── link-parser.js            # Link discovery and parsing
│   ├── crawler.js                # Multi-page crawling
│   └── utils.js                  # Utilities and markdown conversion
├── package.json                  # Project configuration
├── package-lock.json             # Dependency lock file
├── README.md                     # This documentation
├── LICENSE                       # License file
└── .gitignore                    # Git ignore rules
```

## 📁 Output Structure

### Single Page Extraction
```
my-content/
├── README.md              # Overview and editing instructions
└── extracted-content.md   # Main content in Markdown format
```

### Multi-Page Crawling
```
my-content/
├── index.md               # Homepage (/)
├── about.md               # About page (/about)
├── contact.md             # Contact page (/contact)
├── services.md            # Services page (/services)
├── blog/
│   ├── post-1.md          # Blog post (/blog/post-1)
│   └── post-2.md          # Blog post (/blog/post-2)
└── README.md              # Overview with all pages listed
```

The extracted content includes:
- **Headings** (H1-H6): Properly formatted with markdown headers
- **Paragraphs**: Clean text content
- **Lists**: Both ordered and unordered lists
- **Blockquotes**: Quoted content
- **Code blocks**: Pre-formatted code sections
- **CSS Selectors**: Comments with precise selectors for each content piece

## ⚙️ How It Works

The smart extractor automatically chooses the best extraction method:

### 1. HTTP Extraction (Fast)
- **Direct HTTP Requests**: No browser required
- **HTML Parsing**: Uses Cheerio for fast parsing
- **Static Content**: Perfect for traditional websites
- **Instant Results**: No startup time

### 2. Browser Extraction (Comprehensive)
- **Puppeteer Automation**: Full browser rendering
- **JavaScript Support**: Handles React, Vue, Angular, etc.
- **Dynamic Content**: Extracts client-side rendered content
- **Complete Rendering**: Waits for content to load

### 3. Multi-Page Crawling
- **Route Discovery**: Automatically finds all internal links
- **Depth Control**: Configurable crawling depth (1-5 levels)
- **Smart Filtering**: Exclude pages based on patterns
- **File Organization**: Creates logical structure based on routes

### Smart Method Selection

The extractor automatically:
1. **Tries HTTP First**: Fast extraction for static sites
2. **Detects JavaScript**: Identifies React/Vue/Angular frameworks
3. **Falls Back to Browser**: When HTTP extraction finds no content
4. **Provides Feedback**: Shows which method was used

### Content Detection Strategy

The extractor looks for content in this order:
- `<main>` elements
- Elements with `role="main"`
- `<article>` elements
- Common content classes (`.content`, `.post-content`, etc.)
- Falls back to `<body>` if no main content area is found

### Navigation Filtering

The extractor automatically removes:
- Navigation menus and breadcrumbs
- Headers and footers
- Sidebars and advertisements
- Forms and interactive elements
- Script and style tags

## 🎯 Advantages

### ✅ **Smart & Adaptive**
- Automatically chooses the best extraction method
- Handles both static and dynamic websites
- Preserves content ordering and hierarchy
- Generates precise CSS selectors

### ✅ **Multi-Page Capable**
- Extracts entire websites automatically
- Creates organized file structure
- Supports complex route hierarchies
- Comprehensive overview generation

### ✅ **Fast & Reliable**
- HTTP extraction for instant results
- Browser extraction when needed
- Consistent results across different sites
- Robust error handling

### ✅ **Perfect for Content Sync**
- CSS selectors enable precise targeting
- Natural document flow preserved
- Clean, editable markdown output
- Metadata for tracking changes

### ✅ **Modular & Maintainable**
- Clean, organized codebase
- Easy to extend and modify
- Clear separation of concerns
- Professional project structure

## 📋 Command Line Options

### Single Page Extraction
```bash
content-sync <url> [output-dir]
```

### Multi-Page Crawling
```bash
content-sync <url> [output-dir] [options]
```

### Available Options
- **`--main`**: Extract main pages only (depth 1)
- **`--depth <number>`**: Crawl to specific depth (1-5)
- **`--filter <pattern>`**: Filter out pages containing pattern (can be used multiple times)
- **`--max-pages <number>`**: Maximum pages to extract (default: 50)

### Examples
```bash
# Single page
content-sync https://example.com ./output

# Main pages only
content-sync https://example.com ./output --main

# Deep crawl with filters
content-sync https://example.com ./output --depth 3 --filter admin --filter login

# Limited crawl
content-sync https://example.com ./output --main --max-pages 10
```

## ⚠️ Limitations

- **Browser Dependencies**: Puppeteer required for JavaScript-heavy sites
- **Performance**: Browser extraction is slower than HTTP
- **Memory Usage**: Browser automation uses more resources
- **Crawl Depth**: Maximum depth of 5 levels for performance
- **Page Limits**: Default maximum of 50 pages per crawl

## 🐛 Troubleshooting

### Common Issues

1. **HTTP Errors**
   ```bash
   # Check if the URL is accessible
   curl -I https://example.com
   ```

2. **No Content Found**
   - The website might use JavaScript to load content
   - The extractor will automatically switch to browser mode
   - Check if the site requires authentication

3. **Permission Errors**
   ```bash
   # Make sure you have write permissions to the output directory
   mkdir -p ./my-content
   ```

4. **Browser Launch Issues**
   ```bash
   # On Linux, you might need additional dependencies
   sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
   ```

5. **Multi-Page Crawling Issues**
   - Check if the site has internal links
   - Try increasing the depth with `--depth 2`
   - Use filters to exclude problematic pages
   - Check the maximum page limit with `--max-pages`

## 📝 Content Editing

### Markdown Format

The extracted content includes metadata and selectors:

```markdown
# Welcome to Our Site

<!-- Content extracted from: https://example.com -->
<!-- Extracted at: 2024-01-15T10:30:00.000Z -->
<!-- Method: Smart (HTTP/Browser) -->

<!-- Selector: h1.text-5xl -->
# Welcome to Our Site

<!-- Selector: p.text-xl -->
Welcome to our amazing website!

<!-- Selector: h2.text-4xl -->
## About Us

<!-- Selector: p.text-lg -->
We are a company dedicated to...
```

### CSS Selectors

Each content piece includes a CSS selector comment that enables:
- **Precise Targeting**: Find exact elements for content sync
- **Easy Replacement**: Update specific content sections
- **Version Control**: Track changes to specific elements
- **Automation**: Programmatic content updates

### Editing Instructions

1. Edit the content in the markdown files
2. Maintain the structure and formatting
3. Keep the metadata comments at the top
4. Preserve CSS selector comments for content sync
5. Save your changes

### Multi-Page Organization

When crawling multiple pages:
- Each page gets its own markdown file
- Files are named according to routes
- Nested routes create subfolders
- Overview README lists all extracted pages

## 🏗️ Development

### Project Structure

The codebase is organized into modular components:

- **`src/cli.js`**: Command line interface and argument parsing
- **`src/extractor.js`**: Main orchestrator for smart method selection
- **`src/http-extractor.js`**: HTTP-based content extraction
- **`src/browser-extractor.js`**: Browser-based content extraction
- **`src/content-parser.js`**: HTML parsing and content extraction
- **`src/link-parser.js`**: Link discovery and URL parsing
- **`src/crawler.js`**: Multi-page website crawling
- **`src/utils.js`**: Markdown conversion and utilities

### Adding New Features

1. **New Extraction Method**: Add a new extractor in `src/`
2. **Content Types**: Extend `src/content-parser.js`
3. **CLI Options**: Update `src/cli.js`
4. **Utilities**: Add to `src/utils.js`

### Testing

```bash
# Test single page extraction
content-sync https://example.com ./test-output

# Test multi-page crawling
content-sync https://example.com ./test-output --main

# Test with filters
content-sync https://example.com ./test-output --depth 2 --filter admin
```

## 🤝 Contributing

The project is open for contributions! Key areas for improvement:

1. **Enhanced Content Detection**: Better algorithms for finding main content
2. **More Content Types**: Support for tables, images, and other elements
3. **Configuration Options**: Custom selectors and filtering rules
4. **Performance**: Optimize for large websites
5. **Error Handling**: Better error messages and recovery
6. **Crawling Features**: Sitemap support, robots.txt parsing, rate limiting
7. **Testing**: Unit tests and integration tests
8. **Documentation**: API documentation and examples

### Development Setup

```bash
# Clone and install
git clone <repository-url>
cd contentsync
npm install
npm link

# Make changes to files in src/
# Test your changes
content-sync https://example.com ./test-output

# Submit a pull request
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Status**: ✅ Production Ready  
**Method**: Smart Extraction (HTTP + Browser) + Multi-Page Crawling  
**Architecture**: Modular (8 files, ~1,260 lines total)  
**Dependencies**: 4 packages (cheerio, fs-extra, node-fetch, puppeteer)
