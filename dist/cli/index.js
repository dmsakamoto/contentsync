#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const extraction_orchestrator_1 = require("../orchestrator/extraction-orchestrator");
const manager_1 = require("../config/manager");
const logger_1 = require("../utils/logger");
const program = new commander_1.Command();
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
    }
    catch (error) {
        console.error(chalk_1.default.red('Extraction failed:'), error);
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
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to create config file:'), error);
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
    }
    catch (error) {
        console.error(chalk_1.default.red('Validation failed:'), error);
        process.exit(1);
    }
});
async function extractCommand(url, options) {
    console.log(chalk_1.default.blue('🚀 Content Sync Utility'));
    console.log(chalk_1.default.gray('Extracting content from:'), chalk_1.default.cyan(url));
    console.log('');
    // Load configuration
    let config;
    if (options.config) {
        config = await manager_1.ConfigManager.loadFromFile(options.config);
    }
    else {
        // Create config from command line options
        config = {
            siteUrl: url,
            outputDir: options.output,
            fileStructure: options.structure,
            pages: options.pages,
            headless: options.headless,
            waitTime: parseInt(options.waitTime, 10),
            maxConcurrency: parseInt(options.maxConcurrency, 10),
            generateReadme: true,
        };
    }
    // Validate configuration
    const errors = config.validate();
    if (errors.length > 0) {
        console.error(chalk_1.default.red('Configuration errors:'));
        errors.forEach(error => console.error(chalk_1.default.red(`  - ${error}`)));
        process.exit(1);
    }
    // Create logger
    const logger = new logger_1.ConsoleLogger(options.verbose);
    // Create orchestrator
    const orchestrator = new extraction_orchestrator_1.ExtractionOrchestrator(config, logger);
    // Run extraction
    const result = await orchestrator.extract();
    // Display results
    console.log('');
    if (result.success) {
        console.log(chalk_1.default.green('✅ Extraction completed successfully!'));
        console.log(chalk_1.default.gray(`📁 Output directory: ${config.outputDir}`));
        console.log(chalk_1.default.gray(`📄 Pages processed: ${result.metadata.pages.length}`));
        console.log(chalk_1.default.gray(`📝 Content pieces: ${Object.keys(result.metadata.contentMap).length}`));
        console.log(chalk_1.default.gray(`⏱️  Processing time: ${result.processingTime}ms`));
    }
    else {
        console.log(chalk_1.default.yellow('⚠️  Extraction completed with errors'));
        console.log(chalk_1.default.gray(`📁 Output directory: ${config.outputDir}`));
        console.log(chalk_1.default.gray(`❌ Errors: ${result.errors.length}`));
        console.log(chalk_1.default.gray(`⚠️  Warnings: ${result.warnings.length}`));
    }
    // Display errors if any
    if (result.errors.length > 0) {
        console.log('');
        console.log(chalk_1.default.red('Errors:'));
        result.errors.forEach(error => {
            console.log(chalk_1.default.red(`  - ${error.message}`));
            if (error.url) {
                console.log(chalk_1.default.gray(`    URL: ${error.url}`));
            }
        });
    }
    // Display warnings if any
    if (result.warnings.length > 0) {
        console.log('');
        console.log(chalk_1.default.yellow('Warnings:'));
        result.warnings.forEach(warning => {
            console.log(chalk_1.default.yellow(`  - ${warning}`));
        });
    }
    console.log('');
    console.log(chalk_1.default.blue('📖 Next steps:'));
    console.log(chalk_1.default.gray('1. Review the extracted content in the output directory'));
    console.log(chalk_1.default.gray('2. Edit the markdown files as needed'));
    console.log(chalk_1.default.gray('3. Use the sync command to update the website'));
}
async function initCommand(options) {
    console.log(chalk_1.default.blue('📝 Creating default configuration file...'));
    await manager_1.ConfigManager.createDefaultConfig(options.output);
    console.log(chalk_1.default.green('✅ Configuration file created successfully!'));
    console.log(chalk_1.default.gray(`📁 File: ${options.output}`));
    console.log('');
    console.log(chalk_1.default.blue('📖 Next steps:'));
    console.log(chalk_1.default.gray('1. Edit the configuration file to customize settings'));
    console.log(chalk_1.default.gray('2. Run the extract command with your website URL'));
}
async function validateCommand(configFile) {
    console.log(chalk_1.default.blue('🔍 Validating configuration file...'));
    try {
        const config = await manager_1.ConfigManager.loadFromFile(configFile);
        const errors = config.validate();
        if (errors.length === 0) {
            console.log(chalk_1.default.green('✅ Configuration is valid!'));
            console.log(chalk_1.default.gray(`🌐 Site URL: ${config.siteUrl}`));
            console.log(chalk_1.default.gray(`📁 Output directory: ${config.outputDir}`));
            console.log(chalk_1.default.gray(`📂 File structure: ${config.fileStructure}`));
        }
        else {
            console.log(chalk_1.default.red('❌ Configuration has errors:'));
            errors.forEach(error => console.log(chalk_1.default.red(`  - ${error}`)));
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Failed to load configuration:'), error);
        process.exit(1);
    }
}
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk_1.default.red('Unhandled Rejection at:'), promise);
    console.error(chalk_1.default.red('Reason:'), reason);
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error(chalk_1.default.red('Uncaught Exception:'), error);
    process.exit(1);
});
// Parse command line arguments
program.parse();
//# sourceMappingURL=index.js.map