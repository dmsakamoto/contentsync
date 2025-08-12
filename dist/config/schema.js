"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.DEFAULT_CONFIG = {
    outputDir: './content',
    fileStructure: 'pages',
    maxConcurrency: 3,
    headless: true,
    viewport: { width: 1200, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    contentSelectors: [
        'main',
        '[role="main"]',
        'article',
        '.content',
        '.post-content',
    ],
    excludeSelectors: [
        'nav',
        'header',
        'footer',
        '.navigation',
        '.sidebar',
        '[role="navigation"]',
        '.ads',
        '.social-share',
    ],
    waitForSelector: 'main',
    waitTime: 2000,
    generateReadme: true,
};
//# sourceMappingURL=schema.js.map