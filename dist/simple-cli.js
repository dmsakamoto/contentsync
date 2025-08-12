#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const simple_extractor_1 = require("./simple-extractor");
const path = __importStar(require("path"));
async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log('Usage: node simple-cli.js <url> <output-directory> [options]');
        console.log('');
        console.log('Options:');
        console.log('  --headless=false    Show browser window (default: true)');
        console.log('  --wait-time=5000    Wait time in milliseconds (default: 2000)');
        console.log('');
        console.log('Example:');
        console.log('  node simple-cli.js https://example.com ./content');
        console.log('  node simple-cli.js https://example.com ./content --headless=false --wait-time=5000');
        process.exit(1);
    }
    const url = args[0];
    const outputDir = path.resolve(args[1]);
    // Parse options
    const options = {};
    for (let i = 2; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const [key, value] = arg.substring(2).split('=');
            if (key === 'headless') {
                options.headless = value !== 'false';
            }
            else if (key === 'wait-time') {
                options.waitTime = parseInt(value, 10);
            }
        }
    }
    console.log('🎯 Content Sync Utility - Simple Version');
    console.log('=====================================');
    const extractor = new simple_extractor_1.SimpleExtractor({
        siteUrl: url,
        outputDir,
        headless: options.headless !== false,
        waitTime: options.waitTime || 2000
    });
    const result = await extractor.extract();
    if (result.success) {
        console.log('');
        console.log('🎉 Success! Content has been extracted.');
        console.log('');
        console.log('Next steps:');
        console.log(`1. Edit the content in: ${outputDir}/extracted-content.md`);
        console.log('2. Review the README.md for instructions');
        console.log('3. Use the sync functionality when ready (coming soon)');
    }
    else {
        console.error('');
        console.error('💥 Extraction failed!');
        console.error(`Error: ${result.error}`);
        process.exit(1);
    }
}
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Run the CLI
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
