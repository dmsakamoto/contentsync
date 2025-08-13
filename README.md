# Content Sync Utility

Extract text content from websites and convert it into editable Markdown files. This enables non-technical clients to edit website copy through GitHub's interface without requiring expensive CMS solutions or technical expertise.

## 🚀 Features

- **Smart Extraction**: Automatically chooses between HTTP and browser extraction methods
- **Dual-Mode Operation**: Fast HTTP extraction for static sites, browser automation for JavaScript-heavy sites
- **Content Ordering**: Preserves natural document flow and hierarchy
- **CSS Selector Generation**: Creates precise selectors for content synchronization
- **Markdown Conversion**: Converts HTML content to clean, editable Markdown format
- **Multiple Content Types**: Extracts headings, paragraphs, lists, blockquotes, and code blocks
- **Navigation Filtering**: Intelligently filters out navigation and non-content elements
- **Simple CLI**: Easy-to-use command-line interface

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

### Simple Extraction

```bash
# Basic extraction
content-sync https://example.com

# With custom output directory
content-sync https://example.com ./my-content

# Using npm start
npm start https://example.com ./my-content
```

### Direct Node Usage

```bash
# Run directly with node
node smart-extractor.js https://example.com ./my-content
```

### Review and Edit

The extracted content will be saved in the specified output directory with the following structure:

```
my-content/
├── README.md              # Overview and editing instructions
└── extracted-content.md   # Main content in Markdown format
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

## ⚠️ Limitations

- **Browser Dependencies**: Puppeteer required for JavaScript-heavy sites
- **Performance**: Browser extraction is slower than HTTP
- **Memory Usage**: Browser automation uses more resources

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

1. Edit the content in `extracted-content.md`
2. Maintain the structure and formatting
3. Keep the metadata comments at the top
4. Preserve CSS selector comments for content sync
5. Save your changes

## 🤝 Contributing

The project is open for contributions! Key areas for improvement:

1. **Enhanced Content Detection**: Better algorithms for finding main content
2. **More Content Types**: Support for tables, images, and other elements
3. **Configuration Options**: Custom selectors and filtering rules
4. **Performance**: Optimize for large websites
5. **Error Handling**: Better error messages and recovery

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Status**: ✅ Production Ready  
**Method**: Smart Extraction (HTTP + Browser)  
**Dependencies**: 4 packages (cheerio, fs-extra, node-fetch, puppeteer)
