# Content Sync Utility

Extract text content from websites and convert it into editable Markdown files. This enables non-technical clients to edit website copy through GitHub's interface without requiring expensive CMS solutions or technical expertise.

## 🚀 Features

- **Fast HTTP Extraction**: Uses direct HTTP requests for quick, reliable content extraction
- **Smart Content Parsing**: Automatically identifies and extracts semantic content areas from websites
- **Markdown Conversion**: Converts HTML content to clean, editable Markdown format
- **No Browser Required**: Lightweight extraction without browser automation dependencies
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
node http-extractor.js https://example.com ./my-content
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

## ⚙️ How It Works

The HTTP extractor works by:

1. **Making HTTP Requests**: Direct requests to websites without browser automation
2. **HTML Parsing**: Uses Cheerio to parse and analyze HTML content
3. **Smart Content Detection**: Identifies main content areas using semantic selectors
4. **Navigation Filtering**: Automatically removes navigation, headers, and footers
5. **Markdown Conversion**: Converts HTML to clean, editable Markdown format

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

### ✅ **Fast & Lightweight**
- No browser startup time
- No Puppeteer dependencies
- Direct HTTP requests
- Instant content extraction

### ✅ **Reliable**
- Fewer moving parts
- No browser crashes
- Consistent results
- Better error handling

### ✅ **Perfect for Most Websites**
- Works with static content
- Handles server-rendered pages
- Extracts all common content types
- Filters navigation automatically

## ⚠️ Limitations

- **No JavaScript Rendering**: Won't extract dynamically loaded content
- **Static Content Only**: Best for traditional websites
- **No Interactive Elements**: Can't handle complex SPAs

## 🐛 Troubleshooting

### Common Issues

1. **HTTP Errors**
   ```bash
   # Check if the URL is accessible
   curl -I https://example.com
   ```

2. **No Content Found**
   - The website might use JavaScript to load content
   - Try a different website with static content
   - Check if the site requires authentication

3. **Permission Errors**
   ```bash
   # Make sure you have write permissions to the output directory
   mkdir -p ./my-content
   ```

## 📝 Content Editing

### Markdown Format

The extracted content includes metadata comments:

```markdown
# Welcome to Our Site

<!-- Content extracted from: https://example.com -->
<!-- Extracted at: 2024-01-15T10:30:00.000Z -->
<!-- Method: HTTP Request (no browser) -->

Welcome to our amazing website!

## About Us

We are a company dedicated to...
```

### Editing Instructions

1. Edit the content in `extracted-content.md`
2. Maintain the structure and formatting
3. The metadata comments at the top should not be removed
4. Save your changes

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
**Method**: HTTP Extraction (no browser)  
**Dependencies**: 3 packages (cheerio, fs-extra, node-fetch)
