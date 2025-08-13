#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ExtractionOrchestrator } from '../orchestrator/extraction-orchestrator';
import { ConfigManager } from '../config/manager';
import { ConsoleLogger } from '../utils/logger';
import { ExtractionConfig } from '../types';

const program = new Command();

program
  .name('content-sync')
  .description('Extract text content from React/Next.js websites and convert to editable Markdown files')
  .version('1.0.0');

program
  .command('extract')
  .description('Extract content from a website')
  .argument('<url>', 'Website URL to extract content from')
  .option('-o, --output <path>', 'Output directory (default: ./content)', './content')
  .option('-c, --config <file>', 'Configuration file path')
  .option('--pages <urls...>', 'Specific pages to extract')
  .option('--structure <type>', 'File structure type: pages, components, or hybrid', 'pages')
  .option('--headless', 'Run browser in headless mode', true)
  .option('--wait-time <ms>', 'Wait time after page load (ms)', '2000')
  .option('--max-concurrency <number>', 'Maximum concurrent page processing', '3')
  .option('--verbose', 'Enable verbose logging')
  .option('--dry-run', 'Preview extraction without writing files')
  .action(async (url, options) => {
    try {
      await extractCommand(url, options);
    } catch (error) {
      console.error(chalk.red('Extraction failed:'), error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Create a default configuration file')
  .option('-o, --output <file>', 'Output configuration file path', 'content-sync.config.js')
  .action(async (options) => {
    try {
      await initCommand(options);
    } catch (error) {
      console.error(chalk.red('Failed to create config file:'), error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate configuration file')
  .argument('<config-file>', 'Configuration file to validate')
  .action(async (configFile) => {
    try {
      await validateCommand(configFile);
    } catch (error) {
      console.error(chalk.red('Validation failed:'), error);
      process.exit(1);
    }
  });

async function extractCommand(url: string, options: any) {
  console.log(chalk.blue('🚀 Content Sync Utility'));
  console.log(chalk.gray('Extracting content from:'), chalk.cyan(url));
  console.log('');

  // Load configuration
  let configManager: ConfigManager;
  
  if (options.config) {
    configManager = await ConfigManager.loadFromFile(options.config);
  } else {
    // Create config from command line options
    configManager = new ConfigManager({
      siteUrl: url,
      outputDir: options.output,
      fileStructure: options.structure as 'pages' | 'components' | 'hybrid',
      pages: options.pages,
      headless: options.headless,
      waitTime: parseInt(options.waitTime, 10),
      maxConcurrency: parseInt(options.maxConcurrency, 10),
      generateReadme: true,
    });
  }

  // Validate configuration
  const errors = configManager.validate();
  if (errors.length > 0) {
    console.error(chalk.red('Configuration errors:'));
    errors.forEach(error => console.error(chalk.red(`  - ${error}`)));
    process.exit(1);
  }

  // Create logger
  const logger = new ConsoleLogger(options.verbose);

  // Create orchestrator
  const orchestrator = new ExtractionOrchestrator(configManager, logger);

  // Run extraction
  const result = await orchestrator.extract();

  // Display results
  const configData = configManager.getConfig();
  console.log('');
  if (result.success) {
    console.log(chalk.green('✅ Extraction completed successfully!'));
    console.log(chalk.gray(`📁 Output directory: ${configData.outputDir}`));
    console.log(chalk.gray(`📄 Pages processed: ${result.metadata.pages.length}`));
    console.log(chalk.gray(`📝 Content pieces: ${Object.keys(result.metadata.contentMap).length}`));
    console.log(chalk.gray(`⏱️  Processing time: ${result.processingTime}ms`));
  } else {
    console.log(chalk.yellow('⚠️  Extraction completed with errors'));
    console.log(chalk.gray(`📁 Output directory: ${configData.outputDir}`));
    console.log(chalk.gray(`❌ Errors: ${result.errors.length}`));
    console.log(chalk.gray(`⚠️  Warnings: ${result.warnings.length}`));
  }

  // Display errors if any
  if (result.errors.length > 0) {
    console.log('');
    console.log(chalk.red('Errors:'));
    result.errors.forEach(error => {
      console.log(chalk.red(`  - ${error.message}`));
      if (error.url) {
        console.log(chalk.gray(`    URL: ${error.url}`));
      }
    });
  }

  // Display warnings if any
  if (result.warnings.length > 0) {
    console.log('');
    console.log(chalk.yellow('Warnings:'));
    result.warnings.forEach(warning => {
      console.log(chalk.yellow(`  - ${warning}`));
    });
  }

  console.log('');
  console.log(chalk.blue('📖 Next steps:'));
  console.log(chalk.gray('1. Review the extracted content in the output directory'));
  console.log(chalk.gray('2. Edit the markdown files as needed'));
  console.log(chalk.gray('3. Use the sync command to update the website'));
}

async function initCommand(options: any) {
  console.log(chalk.blue('📝 Creating default configuration file...'));
  
  await ConfigManager.createDefaultConfig(options.output);
  
  console.log(chalk.green('✅ Configuration file created successfully!'));
  console.log(chalk.gray(`📁 File: ${options.output}`));
  console.log('');
  console.log(chalk.blue('📖 Next steps:'));
  console.log(chalk.gray('1. Edit the configuration file to customize settings'));
  console.log(chalk.gray('2. Run the extract command with your website URL'));
}

async function validateCommand(configFile: string) {
  console.log(chalk.blue('🔍 Validating configuration file...'));
  
  try {
    const configManager = await ConfigManager.loadFromFile(configFile);
    const errors = configManager.validate();
    const config = configManager.getConfig();
    
    if (errors.length === 0) {
      console.log(chalk.green('✅ Configuration is valid!'));
      console.log(chalk.gray(`🌐 Site URL: ${config.siteUrl}`));
      console.log(chalk.gray(`📁 Output directory: ${config.outputDir}`));
      console.log(chalk.gray(`📂 File structure: ${config.fileStructure}`));
    } else {
      console.log(chalk.red('❌ Configuration has errors:'));
      errors.forEach(error => console.log(chalk.red(`  - ${error}`)));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('❌ Failed to load configuration:'), error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise);
  console.error(chalk.red('Reason:'), reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

// Parse command line arguments
program.parse();
