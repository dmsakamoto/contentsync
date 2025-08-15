#!/usr/bin/env node

const SmartExtractor = require('./extractor');
const SyncBack = require('./sync-back');
const fs = require('fs-extra');
const path = require('path');

// CLI interface
if (require.main === module) {
  main();
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Usage: content-sync <input> [output-dir] [options]');
    console.log('');
    console.log('Examples:');
    console.log('  # Single page extraction');
    console.log('  content-sync https://example.com ./my-content');
    console.log('');
    console.log('  # Local file processing');
    console.log('  content-sync ./my-html-file.html ./my-content');
    console.log('  content-sync ./my-html-directory ./my-content');
    console.log('');
    console.log('  # Multi-page crawling');
    console.log('  content-sync https://example.com ./my-content --main');
    console.log('  content-sync https://example.com ./my-content --depth 3');
    console.log('  content-sync https://example.com ./my-content --depth 2 --filter admin --filter login');
    console.log('');
    console.log('  # Sync edited markdown back to HTML');
    console.log('  content-sync --sync-back ./my-content ./html-source');
    console.log('  content-sync --sync-back ./my-content ./html-source --dry-run');
    console.log('');
    console.log('Options:');
    console.log('  <input>                  Website URL or local file/directory path');
    console.log('  [output-dir]             Output directory (default: ./content)');
    console.log('  --main                   Extract main pages only (depth 1)');
    console.log('  --depth <number>         Crawl to specific depth (1-5)');
    console.log('  --filter <pattern>       Filter out pages containing pattern (can be used multiple times)');
    console.log('  --max-pages <number>     Maximum pages to extract (default: 50)');
    console.log('  --exclude <pattern>      Exclude files/directories matching pattern (local processing)');
    console.log('  --sync-back              Sync edited markdown files back to HTML');
    console.log('  --dry-run                Preview changes without modifying files (sync-back mode)');
    console.log('');
    console.log('This extractor automatically chooses between HTTP and browser extraction for URLs,');
    console.log('or processes local HTML files and directories.');
    process.exit(1);
  }

  const input = args[0];
  
  // Check if this is a sync-back operation
  if (input === '--sync-back') {
    await handleSyncBack(args.slice(1));
    return;
  }
  
  // Check if input is a URL or local path
  const isUrl = input.startsWith('http://') || input.startsWith('https://');
  
  if (!isUrl) {
    // Local file/directory processing
    if (!fs.existsSync(input)) {
      console.error(`❌ Error: File or directory not found: ${input}`);
      console.log('');
      console.log('Usage: content-sync <input> [output-dir] [options]');
      console.log('Example: content-sync ./my-html-file.html ./my-content');
      process.exit(1);
    }
    
    // Parse options for local processing
    const options = {
      excludePatterns: []
    };
    
    let outputDir = './content';
    let i = 1;
    
    while (i < args.length) {
      const arg = args[i];
      
      if (arg === '--exclude') {
        options.excludePatterns.push(args[i + 1]);
        i += 2;
      } else if (!arg.startsWith('--')) {
        outputDir = arg;
        i++;
      } else {
        console.error(`❌ Error: Unknown option for local processing: ${arg}`);
        process.exit(1);
      }
    }
    
    const extractor = new SmartExtractor({
      inputPath: input,
      outputDir,
      excludePatterns: options.excludePatterns
    });
    
    extractor.processLocal().then(result => {
      if (result.success) {
        console.log('');
        console.log('✅ Local processing completed!');
        console.log(`📁 Output directory: ${outputDir}`);
        if (result.totalFiles) {
          console.log(`📄 Files processed: ${result.totalFiles}`);
        }
        console.log(`📝 Content pieces extracted: ${result.content.length}`);
        console.log('');
        console.log('📖 Next steps:');
        console.log('1. Review the extracted content in the output directory');
        console.log('2. Edit the markdown files as needed');
        console.log('3. The content is ready for use!');
      } else {
        console.error('❌ Local processing failed:', result.error);
        process.exit(1);
      }
    }).catch(error => {
      console.error('❌ Local processing error:', error.message);
      process.exit(1);
    });
    
    return;
  }
  
  // URL processing (existing logic)
  const url = input;
  
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

/**
 * Handle sync-back operation
 */
async function handleSyncBack(args) {
  if (args.length === 0) {
    console.error('❌ Error: Please provide markdown directory and HTML directory for sync-back');
    console.log('');
    console.log('Usage: content-sync --sync-back <markdown-dir> <html-dir> [options]');
    console.log('Example: content-sync --sync-back ./my-content ./html-source');
    process.exit(1);
  }

  const markdownDir = args[0];
  const htmlDir = args[1];
  
  if (!markdownDir || !htmlDir) {
    console.error('❌ Error: Both markdown directory and HTML directory are required');
    console.log('');
    console.log('Usage: content-sync --sync-back <markdown-dir> <html-dir> [options]');
    process.exit(1);
  }

  // Check if directories exist
  if (!fs.existsSync(markdownDir)) {
    console.error(`❌ Error: Markdown directory not found: ${markdownDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(htmlDir)) {
    console.error(`❌ Error: HTML directory not found: ${htmlDir}`);
    process.exit(1);
  }

  // Parse options
  const options = {
    dryRun: false
  };
  
  let i = 2;
  while (i < args.length) {
    const arg = args[i];
    
    if (arg === '--dry-run') {
      options.dryRun = true;
      i++;
    } else {
      console.error(`❌ Error: Unknown option for sync-back: ${arg}`);
      process.exit(1);
    }
  }

  // Create sync-back instance
  const syncBack = new SyncBack({
    markdownDir: markdownDir,
    htmlDir: htmlDir,
    dryRun: options.dryRun
  });

  // Execute sync-back
  const result = await syncBack.syncBack();
  
  if (result.success) {
    console.log('\n✅ Sync-back completed successfully!');
  } else {
    console.error('\n❌ Sync-back failed:', result.error);
    process.exit(1);
  }
}

module.exports = { SmartExtractor };
