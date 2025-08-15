const fs = require('fs-extra');
const path = require('path');
const { URL } = require('url');
const ContentUtils = require('./utils');

/**
 * Local File and Directory Processor
 * Handles content extraction from local HTML files and directories
 */

class LocalProcessor {
  constructor(config = {}) {
    this.config = {
      inputPath: config.inputPath || './',
      outputDir: config.outputDir || './content',
      filePatterns: config.filePatterns || ['**/*.html', '**/*.htm'],
      excludePatterns: config.excludePatterns || ['node_modules/**', 'dist/**', 'build/**'],
      ...config
    };
    this.contentUtils = new ContentUtils();
  }

  /**
   * Process local files and directories
   */
  async processLocal(inputPath = null, outputDir = null) {
    const input = inputPath || this.config.inputPath;
    const output = outputDir || this.config.outputDir;

    console.log('📁 Starting local file processing...');
    console.log(`📂 Input path: ${input}`);
    console.log(`📁 Output directory: ${output}`);

    try {
      const stats = await fs.stat(input);
      
      if (stats.isFile()) {
        return await this.processSingleFile(input, output);
      } else if (stats.isDirectory()) {
        return await this.processDirectory(input, output);
      } else {
        throw new Error(`Invalid input: ${input} is not a file or directory`);
      }
    } catch (error) {
      console.error('❌ Local processing failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process a single HTML file
   */
  async processSingleFile(filePath, outputDir) {
    console.log(`📄 Processing file: ${filePath}`);

    try {
      // Read the HTML file
      const htmlContent = await fs.readFile(filePath, 'utf-8');
      
      // Extract content using the content parser
      const title = this.contentUtils.extractTitle(htmlContent);
      const content = this.contentUtils.parseContent(htmlContent, title);
      
      if (content.length === 0) {
        console.log('⚠️  No content found in file');
        return {
          success: false,
          content: [],
          error: 'No content found in file'
        };
      }

      // Generate output filename
      const fileName = this.generateFileName(filePath);
      const outputPath = path.join(outputDir, fileName);
      
      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));
      
      // Convert to markdown and save
      const markdown = this.contentUtils.convertToMarkdown(content, filePath);
      await fs.writeFile(outputPath, markdown);
      
      // Create README
      const readme = this.contentUtils.createReadme([{
        url: filePath,
        route: path.relative(this.config.inputPath, filePath),
        fileName: fileName
      }], this.config.inputPath);
      await fs.writeFile(path.join(outputDir, 'README.md'), readme);

      console.log(`✅ File processed: ${fileName} (${content.length} pieces)`);
      
      return {
        success: true,
        content: content,
        fileName: fileName,
        outputPath: outputPath
      };

    } catch (error) {
      console.error(`❌ Failed to process file ${filePath}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process a directory of HTML files
   */
  async processDirectory(dirPath, outputDir) {
    console.log(`📂 Processing directory: ${dirPath}`);

    try {
      // Find all HTML files in the directory
      const htmlFiles = await this.findHtmlFiles(dirPath);
      
      if (htmlFiles.length === 0) {
        console.log('⚠️  No HTML files found in directory');
        return {
          success: false,
          content: [],
          error: 'No HTML files found in directory'
        };
      }

      console.log(`📋 Found ${htmlFiles.length} HTML files to process`);

      const processedFiles = [];
      const allContent = [];

      // Process each HTML file
      for (const filePath of htmlFiles) {
        console.log(`\n📄 Processing: ${path.relative(dirPath, filePath)}`);
        
        const result = await this.processSingleFile(filePath, outputDir);
        
        if (result.success) {
          processedFiles.push({
            url: filePath,
            route: path.relative(dirPath, filePath),
            fileName: result.fileName
          });
          allContent.push(...result.content);
        }
      }

      // Create overview README
      if (processedFiles.length > 0) {
        const readme = this.contentUtils.createReadme(processedFiles, dirPath);
        await fs.writeFile(path.join(outputDir, 'README.md'), readme);
      }

      console.log(`\n🎉 Directory processing completed!`);
      console.log(`📁 Output directory: ${outputDir}`);
      console.log(`📄 Files processed: ${processedFiles.length}`);
      console.log(`📝 Total content pieces: ${allContent.length}`);

      return {
        success: true,
        content: allContent,
        processedFiles: processedFiles,
        totalFiles: processedFiles.length
      };

    } catch (error) {
      console.error('❌ Directory processing failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find all HTML files in a directory (recursive)
   */
  async findHtmlFiles(dirPath) {
    const htmlFiles = [];
    
    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          // Skip excluded directories
          if (this.shouldExclude(itemPath)) {
            continue;
          }
          
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
      console.warn(`⚠️  Could not read directory ${dirPath}:`, error.message);
    }
    
    return htmlFiles;
  }

  /**
   * Check if a path should be excluded
   */
  shouldExclude(filePath) {
    const relativePath = path.relative(this.config.inputPath, filePath);
    
    return this.config.excludePatterns.some(pattern => {
      // Simple pattern matching (can be enhanced with glob patterns)
      if (pattern.includes('**')) {
        const regexPattern = pattern.replace(/\*\*/g, '.*');
        return new RegExp(regexPattern).test(relativePath);
      }
      return relativePath.includes(pattern.replace('**', ''));
    });
  }

  /**
   * Generate filename from file path
   */
  generateFileName(filePath) {
    // If inputPath is a file, use the file's name directly
    if (this.config.inputPath === filePath) {
      const nameWithoutExt = path.basename(filePath, path.extname(filePath));
      return `${nameWithoutExt}.md`;
    }
    
    // Otherwise, calculate relative path
    const relativePath = path.relative(this.config.inputPath, filePath);
    const nameWithoutExt = path.basename(relativePath, path.extname(relativePath));
    const dir = path.dirname(relativePath);
    
    // Handle index files
    if (nameWithoutExt.toLowerCase() === 'index') {
      if (dir === '.') {
        return 'index.md';
      } else {
        return path.join(dir, 'index.md');
      }
    }
    
    // Regular files
    if (dir === '.') {
      return `${nameWithoutExt}.md`;
    } else {
      return path.join(dir, `${nameWithoutExt}.md`);
    }
  }

  /**
   * Process a specific file type or pattern
   */
  async processByPattern(pattern, outputDir) {
    console.log(`🔍 Processing files matching pattern: ${pattern}`);
    
    // This could be enhanced with glob pattern matching
    // For now, we'll use the existing directory processing
    return await this.processDirectory(this.config.inputPath, outputDir);
  }
}

module.exports = LocalProcessor;
