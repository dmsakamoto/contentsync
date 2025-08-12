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
exports.ConfigManager = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const schema_1 = require("./schema");
class ConfigManager {
    constructor(config) {
        this.config = this.mergeWithDefaults(config || {});
    }
    /**
     * Load configuration from a file
     */
    static async loadFromFile(configPath) {
        try {
            const fullPath = path.resolve(configPath);
            const configContent = await fs.readFile(fullPath, 'utf-8');
            let config;
            if (configPath.endsWith('.json')) {
                config = JSON.parse(configContent);
            }
            else if (configPath.endsWith('.js')) {
                // For JavaScript config files, we'd need to evaluate them
                // This is a simplified version - in production you might want to use vm module
                config = require(fullPath);
            }
            else {
                throw new Error(`Unsupported config file format: ${configPath}`);
            }
            return new ConfigManager(config);
        }
        catch (error) {
            throw new Error(`Failed to load config file ${configPath}: ${error}`);
        }
    }
    /**
     * Create default configuration file
     */
    static async createDefaultConfig(outputPath) {
        const defaultConfig = {
            siteUrl: 'https://example.com',
            outputDir: './content',
            fileStructure: 'pages',
            maxConcurrency: 3,
            headless: true,
            viewport: { width: 1200, height: 800 },
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
        const configContent = `module.exports = ${JSON.stringify(defaultConfig, null, 2)};`;
        await fs.writeFile(outputPath, configContent, 'utf-8');
    }
    /**
     * Merge user config with defaults
     */
    mergeWithDefaults(userConfig) {
        const merged = { ...schema_1.DEFAULT_CONFIG, ...userConfig };
        // Ensure required fields are present
        if (!merged.siteUrl) {
            throw new Error('siteUrl is required in configuration');
        }
        if (!merged.outputDir) {
            throw new Error('outputDir is required in configuration');
        }
        return merged;
    }
    /**
     * Validate the configuration
     */
    validate() {
        const errors = [];
        if (!this.config.siteUrl) {
            errors.push('siteUrl is required');
        }
        if (!this.config.outputDir) {
            errors.push('outputDir is required');
        }
        if (this.config.maxConcurrency && this.config.maxConcurrency < 1) {
            errors.push('maxConcurrency must be at least 1');
        }
        if (this.config.waitTime && this.config.waitTime < 0) {
            errors.push('waitTime must be non-negative');
        }
        if (this.config.viewport) {
            if (this.config.viewport.width < 1 || this.config.viewport.height < 1) {
                errors.push('viewport dimensions must be positive');
            }
        }
        return errors;
    }
    /**
     * Get the full configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get specific configuration sections
     */
    getBrowserConfig() {
        return {
            headless: this.config.headless ?? true,
            viewport: this.config.viewport ?? { width: 1200, height: 800 },
            userAgent: this.config.userAgent ?? schema_1.DEFAULT_CONFIG.userAgent,
        };
    }
    getProcessingConfig() {
        return {
            waitForSelector: this.config.waitForSelector,
            waitTime: this.config.waitTime ?? 2000,
            maxConcurrency: this.config.maxConcurrency ?? 3,
        };
    }
    getOutputConfig() {
        return {
            outputDir: this.config.outputDir,
            fileStructure: this.config.fileStructure,
            generateReadme: this.config.generateReadme ?? true,
        };
    }
    getContentSelectionConfig() {
        return {
            contentSelectors: this.config.contentSelectors ?? schema_1.DEFAULT_CONFIG.contentSelectors,
            excludeSelectors: this.config.excludeSelectors ?? schema_1.DEFAULT_CONFIG.excludeSelectors,
            includeNavigation: this.config.includeNavigation ?? false,
        };
    }
    /**
     * Update configuration
     */
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=manager.js.map