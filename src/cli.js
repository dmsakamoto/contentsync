#!/usr/bin/env node

const SmartExtractor = require('./extractor');

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Usage: content-sync <url> [output-dir] [options]');
    console.log('');
    console.log('Examples:');
    console.log('  # Single page extraction');
    console.log('  content-sync https://example.com ./my-content');
    console.log('');
    console.log('  # Multi-page crawling');
    console.log('  content-sync https://example.com ./my-content --main');
    console.log('  content-sync https://example.com ./my-content --depth 3');
    console.log('  content-sync https://example.com ./my-content --depth 2 --filter admin --filter login');
    console.log('');
    console.log('Options:');
    console.log('  <url>                    The website URL to extract content from');
    console.log('  [output-dir]             Output directory (default: ./content)');
    console.log('  --main                   Extract main pages only (depth 1)');
    console.log('  --depth <number>         Crawl to specific depth (1-5)');
    console.log('  --filter <pattern>       Filter out pages containing pattern (can be used multiple times)');
    console.log('  --max-pages <number>     Maximum pages to extract (default: 50)');
    console.log('');
    console.log('This extractor automatically chooses between HTTP and browser extraction.');
    process.exit(1);
  }

  const url = args[0];
  
  // Validate URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.error('❌ Error: Please provide a valid URL starting with http:// or https://');
    console.log('');
    console.log('Usage: content-sync <url> [output-dir] [options]');
    console.log('Example: content-sync https://example.com ./my-content');
    process.exit(1);
  }
  
  // Parse options
  const options = {
    depth: 0,
    filter: [],
    maxPages: 50
  };
  
  let outputDir = './content';
  let i = 1;
  
  // Parse arguments
  while (i < args.length) {
    const arg = args[i];
    
    if (arg === '--main') {
      options.depth = 1;
      i++;
    } else if (arg === '--depth') {
      const depth = parseInt(args[i + 1]);
      if (isNaN(depth) || depth < 1 || depth > 5) {
        console.error('❌ Error: Depth must be a number between 1 and 5');
        process.exit(1);
      }
      options.depth = depth;
      i += 2;
    } else if (arg === '--filter') {
      options.filter.push(args[i + 1]);
      i += 2;
    } else if (arg === '--max-pages') {
      const maxPages = parseInt(args[i + 1]);
      if (isNaN(maxPages) || maxPages < 1) {
        console.error('❌ Error: Max pages must be a positive number');
        process.exit(1);
      }
      options.maxPages = maxPages;
      i += 2;
    } else if (!arg.startsWith('--')) {
      // This is the output directory
      outputDir = arg;
      i++;
    } else {
      console.error(`❌ Error: Unknown option: ${arg}`);
      process.exit(1);
    }
  }

  const extractor = new SmartExtractor({
    siteUrl: url,
    outputDir
  });

  if (options.depth === 0) {
    // Single page extraction
    extractor.extract().then(result => {
      if (result.success) {
        console.log('');
        console.log(`✅ Extraction completed using ${result.method} method!`);
        console.log(`📁 Output directory: ${result.outputDir}`);
        console.log(`📄 Content extracted: ${result.content.length} pieces`);
        console.log('');
        console.log('📖 Next steps:');
        console.log('1. Review the extracted content in the output directory');
        console.log('2. Edit the markdown files as needed');
        console.log('3. The content is ready for use!');
      } else {
        console.error('❌ Extraction failed:', result.error);
        process.exit(1);
      }
    });
  } else {
    // Multi-page crawling
    extractor.crawlWebsite(url, outputDir, options)
      .then((pages) => {
        console.log('\n🎉 Website crawl completed successfully!');
        console.log(`📄 Total pages extracted: ${pages.length}`);
      })
      .catch((error) => {
        console.error('\n❌ Website crawl failed:', error.message);
        process.exit(1);
      });
  }
}

module.exports = { SmartExtractor };
