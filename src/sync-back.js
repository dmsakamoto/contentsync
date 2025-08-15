const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');

/**
 * Reverse Sync Module
 * Syncs edited markdown content back to original HTML files
 */

class SyncBack {
  constructor(config = {}) {
    this.config = {
      markdownDir: config.markdownDir || './content',
      htmlDir: config.htmlDir || './',
      backupDir: config.backupDir || './backup',
      dryRun: config.dryRun || false,
      ...config
    };
  }

  /**
   * Main sync method
   */
  async syncBack() {
    console.log('🔄 Starting reverse sync...');
    console.log(`📁 Markdown directory: ${this.config.markdownDir}`);
    console.log(`📁 HTML directory: ${this.config.htmlDir}`);
    
    if (this.config.dryRun) {
      console.log('🔍 DRY RUN MODE - No files will be modified');
    }

    try {
      // Create backup if not dry run
      if (!this.config.dryRun) {
        await this.createBackup();
      }

      // Find all markdown files
      const markdownFiles = await this.findMarkdownFiles(this.config.markdownDir);
      
      if (markdownFiles.length === 0) {
        console.log('⚠️  No markdown files found');
        return { success: false, error: 'No markdown files found' };
      }

      console.log(`📋 Found ${markdownFiles.length} markdown files to process`);

      const results = {
        processed: 0,
        updated: 0,
        errors: 0,
        changes: []
      };

      // Process each markdown file
      for (const markdownFile of markdownFiles) {
        console.log(`\n📄 Processing: ${path.relative(this.config.markdownDir, markdownFile)}`);
        
        const result = await this.processMarkdownFile(markdownFile);
        
        if (result.success) {
          results.processed++;
          if (result.changes.length > 0) {
            results.updated++;
            results.changes.push(...result.changes);
          }
        } else {
          results.errors++;
          console.error(`❌ Failed to process ${markdownFile}: ${result.error}`);
        }
      }

      // Summary
      console.log('\n🎉 Sync completed!');
      console.log(`📄 Files processed: ${results.processed}`);
      console.log(`✅ Files updated: ${results.updated}`);
      console.log(`❌ Errors: ${results.errors}`);
      console.log(`📝 Total changes: ${results.changes.length}`);

      if (results.changes.length > 0) {
        console.log('\n📋 Changes made:');
        results.changes.forEach(change => {
          console.log(`   • ${change.file}: ${change.selector} - "${change.oldText.substring(0, 50)}..." → "${change.newText.substring(0, 50)}..."`);
        });
      }

      return {
        success: true,
        results: results
      };

    } catch (error) {
      console.error('❌ Sync failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create backup of HTML files
   */
  async createBackup() {
    console.log('💾 Creating backup...');
    
    try {
      // Create backup directory outside of HTML directory
      const backupDir = path.resolve(this.config.backupDir);
      await fs.ensureDir(backupDir);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `backup-${timestamp}`);
      
      // Only backup HTML files, not the entire directory
      const htmlFiles = await this.findHtmlFiles(this.config.htmlDir);
      
      for (const htmlFile of htmlFiles) {
        const relativePath = path.relative(this.config.htmlDir, htmlFile);
        const backupFile = path.join(backupPath, relativePath);
        await fs.ensureDir(path.dirname(backupFile));
        await fs.copy(htmlFile, backupFile);
      }
      
      console.log(`✅ Backup created: ${backupPath} (${htmlFiles.length} files)`);
      
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      throw error;
    }
  }

  /**
   * Find all HTML files in directory
   */
  async findHtmlFiles(dir) {
    const htmlFiles = [];
    
    try {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          // Skip backup directory
          if (item === 'backup') continue;
          
          // Recursively find HTML files in subdirectories
          const subFiles = await this.findHtmlFiles(itemPath);
          htmlFiles.push(...subFiles);
        } else if (stats.isFile()) {
          // Check if it's an HTML file
          const ext = path.extname(item).toLowerCase();
          if (ext === '.html' || ext === '.htm') {
            htmlFiles.push(itemPath);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not read directory ${dir}:`, error.message);
    }
    
    return htmlFiles;
  }

  /**
   * Find all markdown files in directory
   */
  async findMarkdownFiles(dir) {
    const markdownFiles = [];
    
    try {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          // Recursively find markdown files in subdirectories
          const subFiles = await this.findMarkdownFiles(itemPath);
          markdownFiles.push(...subFiles);
        } else if (stats.isFile()) {
          // Check if it's a markdown file
          const ext = path.extname(item).toLowerCase();
          if (ext === '.md') {
            markdownFiles.push(itemPath);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not read directory ${dir}:`, error.message);
    }
    
    return markdownFiles;
  }

  /**
   * Process a single markdown file
   */
  async processMarkdownFile(markdownFile) {
    try {
      // Read markdown content
      const markdownContent = await fs.readFile(markdownFile, 'utf-8');
      
      // Parse markdown and extract content with selectors
      const contentBlocks = this.parseMarkdownContent(markdownContent);
      
      if (contentBlocks.length === 0) {
        return { success: true, changes: [] };
      }

      // Find corresponding HTML file
      const htmlFile = this.findCorrespondingHtmlFile(markdownFile);
      
      if (!htmlFile || !await fs.pathExists(htmlFile)) {
        return { 
          success: false, 
          error: `HTML file not found: ${htmlFile}` 
        };
      }

      // Update HTML file
      const result = await this.updateHtmlFile(htmlFile, contentBlocks);
      
      return result;

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse markdown content and extract content blocks with selectors
   */
  parseMarkdownContent(markdownContent) {
    const contentBlocks = [];
    const lines = markdownContent.split('\n');
    
    let currentSelector = null;
    let currentContent = [];
    let inCodeBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for selector comment
      if (line.trim().startsWith('<!-- Selector:')) {
        // Save previous block if exists
        if (currentSelector && currentContent.length > 0) {
          contentBlocks.push({
            selector: currentSelector,
            content: currentContent.join('\n').trim(),
            type: this.detectContentType(currentContent)
          });
        }
        
        // Start new block
        currentSelector = line.match(/<!-- Selector: (.+) -->/)?.[1];
        currentContent = [];
        continue;
      }
      
      // Skip metadata comments
      if (line.trim().startsWith('<!-- Content extracted from:') ||
          line.trim().startsWith('<!-- Extracted at:') ||
          line.trim().startsWith('<!-- Method:')) {
        continue;
      }
      
      // Handle code blocks
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        if (inCodeBlock) {
          currentContent.push(line);
        } else {
          currentContent.push(line);
        }
        continue;
      }
      
      // Add content to current block
      if (currentSelector && !line.trim().startsWith('<!--')) {
        currentContent.push(line);
      }
    }
    
    // Add final block
    if (currentSelector && currentContent.length > 0) {
      contentBlocks.push({
        selector: currentSelector,
        content: currentContent.join('\n').trim(),
        type: this.detectContentType(currentContent)
      });
    }
    
    return contentBlocks;
  }

  /**
   * Detect content type from markdown content
   */
  detectContentType(content) {
    const text = content.join('\n');
    
    if (text.startsWith('#')) {
      return 'heading';
    } else if (text.startsWith('- ') || text.startsWith('* ')) {
      return 'list';
    } else if (text.startsWith('> ')) {
      return 'blockquote';
    } else if (text.startsWith('```')) {
      return 'code';
    } else {
      return 'paragraph';
    }
  }

  /**
   * Find corresponding HTML file for markdown file
   */
  findCorrespondingHtmlFile(markdownFile) {
    // Remove .md extension and add .html
    const relativePath = path.relative(this.config.markdownDir, markdownFile);
    const nameWithoutExt = path.basename(relativePath, '.md');
    const dir = path.dirname(relativePath);
    
    // Handle index files
    if (nameWithoutExt === 'index') {
      if (dir === '.') {
        return path.join(this.config.htmlDir, 'index.html');
      } else {
        return path.join(this.config.htmlDir, dir, 'index.html');
      }
    }
    
    // Regular files
    if (dir === '.') {
      return path.join(this.config.htmlDir, `${nameWithoutExt}.html`);
    } else {
      return path.join(this.config.htmlDir, dir, `${nameWithoutExt}.html`);
    }
  }

  /**
   * Update HTML file with new content
   */
  async updateHtmlFile(htmlFile, contentBlocks) {
    try {
      // Read HTML file
      const htmlContent = await fs.readFile(htmlFile, 'utf-8');
      const $ = cheerio.load(htmlContent);
      
      const changes = [];
      
      // Update each content block
      for (const block of contentBlocks) {
        const result = this.updateHtmlElement($, block, htmlFile);
        if (result.changed) {
          changes.push(result);
        }
      }
      
      // Write updated HTML if not dry run
      if (!this.config.dryRun && changes.length > 0) {
        await fs.writeFile(htmlFile, $.html());
        console.log(`✅ Updated: ${path.relative(this.config.htmlDir, htmlFile)} (${changes.length} changes)`);
      } else if (this.config.dryRun && changes.length > 0) {
        console.log(`🔍 Would update: ${path.relative(this.config.htmlDir, htmlFile)} (${changes.length} changes)`);
      } else {
        console.log(`ℹ️  No changes needed: ${path.relative(this.config.htmlDir, htmlFile)}`);
      }
      
      return {
        success: true,
        changes: changes
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update a single HTML element
   */
  updateHtmlElement($, block, htmlFile) {
    try {
      const $element = $(block.selector);
      
      if ($element.length === 0) {
        console.warn(`⚠️  Selector not found: ${block.selector}`);
        return { changed: false };
      }
      
      const oldText = $element.text().trim();
      const newText = this.convertMarkdownToText(block.content, block.type);
      
      // Check if content actually changed
      if (oldText === newText) {
        return { changed: false };
      }
      
      // Update the element
      if (block.type === 'heading') {
        // Update heading text
        $element.text(newText);
      } else if (block.type === 'list') {
        // Update list items
        const items = this.parseListItems(block.content);
        $element.empty();
        items.forEach(item => {
          $element.append(`<li>${item}</li>`);
        });
      } else if (block.type === 'blockquote') {
        // Update blockquote
        $element.text(newText);
      } else if (block.type === 'code') {
        // Update code block
        const codeText = this.extractCodeText(block.content);
        $element.text(codeText);
      } else {
        // Update paragraph or other text content
        $element.text(newText);
      }
      
      return {
        changed: true,
        file: path.relative(this.config.htmlDir, htmlFile),
        selector: block.selector,
        oldText: oldText,
        newText: newText
      };
      
    } catch (error) {
      console.warn(`⚠️  Failed to update element with selector ${block.selector}:`, error.message);
      return { changed: false };
    }
  }

  /**
   * Convert markdown content to plain text
   */
  convertMarkdownToText(content, type) {
    switch (type) {
      case 'heading':
        return content.replace(/^#+\s*/, '');
      case 'blockquote':
        return content.replace(/^>\s*/, '');
      case 'code':
        return this.extractCodeText(content);
      case 'list':
        return this.parseListItems(content).join(', ');
      default:
        return content;
    }
  }

  /**
   * Extract code text from markdown code block
   */
  extractCodeText(content) {
    return content.replace(/^```\w*\n/, '').replace(/\n```$/, '');
  }

  /**
   * Parse list items from markdown list
   */
  parseListItems(content) {
    return content
      .split('\n')
      .filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '))
      .map(line => line.replace(/^[-*]\s*/, ''));
  }
}

module.exports = SyncBack;
