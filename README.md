# Content Sync Utility

Extract text content from React/Next.js websites and convert it into editable Markdown files stored in GitHub repositories. This enables non-technical clients to edit website copy through GitHub's interface without requiring expensive CMS solutions or technical expertise.

## 🚀 Features

- **Smart Content Extraction**: Automatically identifies and extracts semantic content areas from React/Next.js websites
- **Browser Automation**: Uses Puppeteer to render dynamic content and handle JavaScript-heavy applications
- **Markdown Conversion**: Converts HTML content to clean, editable Markdown format
- **Metadata Preservation**: Maintains mapping between content and original DOM elements for future sync operations
- **Flexible File Structure**: Supports page-based, component-based, or hybrid content organization
- **Progress Tracking**: Real-time progress indicators and detailed logging
- **Error Handling**: Graceful error recovery and comprehensive error reporting

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

# Build the project
npm run build

# Link globally (optional)
npm link
```

## 🎯 Quick Start

### 1. Initialize Configuration

```bash
# Create a default configuration file
content-sync init

# Or specify a custom path
content-sync init -o my-config.js
```

### 2. Extract Content

```bash
# Basic extraction
content-sync extract https://example.com

# With custom output directory
content-sync extract https://example.com -o ./my-content

# With specific pages
content-sync extract https://example.com --pages https://example.com/about https://example.com/contact

# With custom file structure
content-sync extract https://example.com --structure components

# With verbose logging
content-sync extract https://example.com --verbose
```

### 3. Review and Edit

The extracted content will be saved in the specified output directory with the following structure:

```
content/
├── README.md              # Overview and editing instructions
├── pages/                 # Page-based content (default)
│   ├── index.md          # Homepage content
│   ├── about.md          # About page content
│   └── contact.md        # Contact page content
└── components/           # Component-based content (if using hybrid structure)
    ├── heading-main.md   # Main headings
    └── paragraph-content.md # Content paragraphs
```

## ⚙️ Configuration

### Configuration File Format

Create a `content-sync.config.js` file in your project root:

```javascript
module.exports = {
  // Site Configuration
  siteUrl: 'https://example.com',
  pages: [
    'https://example.com',
    'https://example.com/about',
    'https://example.com/contact'
  ],
  
  // Content Selection
  contentSelectors: [
    'main',
    '[role="main"]',
    'article',
    '.content',
    '.post-content'
  ],
  
  excludeSelectors: [
    'nav',
    'header',
    'footer',
    '.navigation',
    '.sidebar',
    '[role="navigation"]',
    '.ads',
    '.social-share'
  ],
  
  // Processing Options
  waitForSelector: 'main',
  waitTime: 2000,
  maxConcurrency: 3,
  
  // Output Options
  outputDir: './content',
  fileStructure: 'pages', // 'pages', 'components', or 'hybrid'
  generateReadme: true,
  
  // Browser Options
  headless: true,
  viewport: { width: 1200, height: 800 },
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
};
```

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <path>` | Output directory | `./content` |
| `-c, --config <file>` | Configuration file path | None |
| `--pages <urls...>` | Specific pages to extract | All pages |
| `--structure <type>` | File structure type | `pages` |
| `--headless` | Run browser in headless mode | `true` |
| `--wait-time <ms>` | Wait time after page load | `2000` |
| `--max-concurrency <number>` | Maximum concurrent processing | `3` |
| `--verbose` | Enable verbose logging | `false` |
| `--dry-run` | Preview without writing files | `false` |

## 📖 Usage Examples

### Extract from a React Application

```bash
# Extract from a Next.js site
content-sync extract https://my-nextjs-app.vercel.app

# Wait for specific content to load
content-sync extract https://my-react-app.com --wait-time 5000

# Extract only specific pages
content-sync extract https://my-react-app.com \
  --pages https://my-react-app.com/home \
  --pages https://my-react-app.com/about \
  --pages https://my-react-app.com/contact
```

### Extract with Custom Selectors

```bash
# Use custom content selectors
content-sync extract https://example.com \
  --config custom-config.js
```

Where `custom-config.js` contains:

```javascript
module.exports = {
  siteUrl: 'https://example.com',
  contentSelectors: [
    '.main-content',
    '.blog-post',
    '[data-content="true"]'
  ],
  excludeSelectors: [
    '.sidebar',
    '.comments',
    '.related-posts'
  ]
};
```

### Component-Based Extraction

```bash
# Extract content organized by component type
content-sync extract https://example.com --structure components
```

This creates files like:
- `components/heading-h1.md` - All H1 headings
- `components/paragraph-content.md` - All paragraphs
- `components/list-navigation.md` - All lists

## 🔧 Development

### Project Structure

```
src/
├── cli/                    # Command-line interface
├── config/                 # Configuration management
├── converter/              # HTML to Markdown conversion
├── filesystem/             # File structure management
├── metadata/               # Content metadata generation
├── orchestrator/           # Main extraction orchestration
├── parser/                 # Content parsing and extraction
├── renderer/               # Browser rendering
├── types/                  # TypeScript type definitions
└── utils/                  # Utility functions
```

### Building

```bash
# Build the project
npm run build

# Watch for changes during development
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- config/manager.test.ts
```

## 🐛 Troubleshooting

### Common Issues

1. **Browser Launch Failures**
   ```bash
   # Try running with non-headless mode for debugging
   content-sync extract https://example.com --headless false
   ```

2. **Content Not Found**
   ```bash
   # Increase wait time for slow-loading content
   content-sync extract https://example.com --wait-time 5000
   
   # Use custom selectors for specific content areas
   content-sync extract https://example.com -c custom-config.js
   ```

3. **Memory Issues**
   ```bash
   # Reduce concurrency for large sites
   content-sync extract https://example.com --max-concurrency 1
   ```

### Debug Mode

Enable verbose logging to see detailed information:

```bash
content-sync extract https://example.com --verbose
```

## 📝 Content Editing

### Markdown Format

Each extracted content piece includes metadata comments:

```markdown
# Welcome to Our Site

<!-- Content ID: content-a1b2c3d4-1 -->
<!-- Type: heading -->
<!-- Selector: main h1 -->
<!-- Source: https://example.com -->
<!-- Extracted: 2024-01-15T10:30:00.000Z -->

Welcome to our amazing website!

<!-- Content ID: content-e5f6g7h8-2 -->
<!-- Type: paragraph -->
<!-- Selector: main p -->
<!-- Source: https://example.com -->
<!-- Extracted: 2024-01-15T10:30:00.000Z -->

This is the main content of our homepage.
```

### Editing Guidelines

1. **Preserve Structure**: Maintain the heading hierarchy and content flow
2. **Keep Metadata**: Don't remove the metadata comments
3. **Test Changes**: Preview your changes before syncing back to the website
4. **Backup**: Keep backups of your content before making major changes

## 🔄 Sync Strategies

The Content Sync Utility supports multiple sync strategies (planned for future releases):

- **Initial Sync**: First-time content extraction and repository setup
- **Content-Only Sync**: Update text content without changing structure
- **Structure Sync**: Handle new pages, deleted pages, or URL changes
- **Full Re-sync**: Complete rebuild after major site changes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and the PRD for detailed information
- **Issues**: Report bugs and feature requests on GitHub Issues
- **Discussions**: Join the community discussions for questions and ideas

## 🗺️ Roadmap

- [ ] GitHub integration for automated repository management
- [ ] Visual content management (images, videos)
- [ ] Content validation and preview capabilities
- [ ] Multi-language support
- [ ] Advanced sync strategies
- [ ] Integration with deployment platforms
- [ ] Content scheduling and workflows

---

Built with ❤️ for developers who want to make content management easier for their clients.
