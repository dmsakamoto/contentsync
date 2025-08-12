import { ConfigManager } from './manager';
import * as fs from 'fs-extra';
import * as path from 'path';

// Mock fs-extra
jest.mock('fs-extra');

describe('ConfigManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a config manager with default values', () => {
      const config = new ConfigManager({
        siteUrl: 'https://example.com',
        outputDir: './test-output',
      });

      const fullConfig = config.getConfig();
      expect(fullConfig.siteUrl).toBe('https://example.com');
      expect(fullConfig.outputDir).toBe('./test-output');
      expect(fullConfig.headless).toBe(true);
      expect(fullConfig.maxConcurrency).toBe(3);
    });

    it('should throw error when required fields are missing', () => {
      expect(() => new ConfigManager({})).toThrow('siteUrl is required in configuration');
      expect(() => new ConfigManager({ siteUrl: 'https://example.com' })).toThrow('outputDir is required in configuration');
    });
  });

  describe('validate', () => {
    it('should return empty array for valid config', () => {
      const config = new ConfigManager({
        siteUrl: 'https://example.com',
        outputDir: './test-output',
      });

      const errors = config.validate();
      expect(errors).toEqual([]);
    });

    it('should return errors for invalid config', () => {
      const config = new ConfigManager({
        siteUrl: '',
        outputDir: '',
        maxConcurrency: 0,
        waitTime: -1,
      });

      const errors = config.validate();
      expect(errors).toContain('siteUrl is required');
      expect(errors).toContain('outputDir is required');
      expect(errors).toContain('maxConcurrency must be at least 1');
      expect(errors).toContain('waitTime must be non-negative');
    });
  });

  describe('getConfig', () => {
    it('should return a copy of the configuration', () => {
      const config = new ConfigManager({
        siteUrl: 'https://example.com',
        outputDir: './test-output',
      });

      const config1 = config.getConfig();
      const config2 = config.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Should be different objects
    });
  });

  describe('updateConfig', () => {
    it('should update configuration values', () => {
      const config = new ConfigManager({
        siteUrl: 'https://example.com',
        outputDir: './test-output',
      });

      config.updateConfig({
        headless: false,
        maxConcurrency: 5,
      });

      const updatedConfig = config.getConfig();
      expect(updatedConfig.headless).toBe(false);
      expect(updatedConfig.maxConcurrency).toBe(5);
      expect(updatedConfig.siteUrl).toBe('https://example.com'); // Should remain unchanged
    });
  });
});
