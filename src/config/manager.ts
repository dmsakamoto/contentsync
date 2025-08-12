import * as fs from 'fs-extra';
import * as path from 'path';
import { ExtractionConfig, DEFAULT_CONFIG } from './schema';

export class ConfigManager {
  private config: ExtractionConfig;

  constructor(config?: Partial<ExtractionConfig>) {
    this.config = this.mergeWithDefaults(config || {});
  }

  /**
   * Load configuration from a file
   */
  static async loadFromFile(configPath: string): Promise<ConfigManager> {
    try {
      const fullPath = path.resolve(configPath);
      const configContent = await fs.readFile(fullPath, 'utf-8');
      
      let config: Partial<ExtractionConfig>;
      
      if (configPath.endsWith('.json')) {
        config = JSON.parse(configContent);
      } else if (configPath.endsWith('.js')) {
        // For JavaScript config files, we'd need to evaluate them
        // This is a simplified version - in production you might want to use vm module
        config = require(fullPath);
      } else {
        throw new Error(`Unsupported config file format: ${configPath}`);
      }

      return new ConfigManager(config);
    } catch (error) {
      throw new Error(`Failed to load config file ${configPath}: ${error}`);
    }
  }

  /**
   * Create default configuration file
   */
  static async createDefaultConfig(outputPath: string): Promise<void> {
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
  private mergeWithDefaults(userConfig: Partial<ExtractionConfig>): ExtractionConfig {
    const merged = { ...DEFAULT_CONFIG, ...userConfig };

    // Ensure required fields are present
    if (!merged.siteUrl) {
      throw new Error('siteUrl is required in configuration');
    }

    if (!merged.outputDir) {
      throw new Error('outputDir is required in configuration');
    }

    return merged as ExtractionConfig;
  }

  /**
   * Validate the configuration
   */
  validate(): string[] {
    const errors: string[] = [];

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
  getConfig(): ExtractionConfig {
    return { ...this.config };
  }

  /**
   * Get specific configuration sections
   */
  getBrowserConfig() {
    return {
      headless: this.config.headless ?? true,
      viewport: this.config.viewport ?? { width: 1200, height: 800 },
      userAgent: this.config.userAgent ?? DEFAULT_CONFIG.userAgent,
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
      contentSelectors: this.config.contentSelectors ?? DEFAULT_CONFIG.contentSelectors!,
      excludeSelectors: this.config.excludeSelectors ?? DEFAULT_CONFIG.excludeSelectors!,
      includeNavigation: this.config.includeNavigation ?? false,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ExtractionConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}
