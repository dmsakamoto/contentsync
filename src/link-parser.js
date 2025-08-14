const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * Link parsing utilities for website crawling
 */

class LinkParser {
  constructor(config = {}) {
    this.config = {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      ...config
    };
  }

  /**
   * Extract links from a page
   */
  async extractLinks(url, baseUrlObj) {
    try {
      // Try HTTP first
      const response = await fetch(url, {
        headers: { 'User-Agent': this.config.userAgent }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      return this.parseLinks($, baseUrlObj);
    } catch (error) {
      // Fall back to browser extraction for JavaScript-heavy sites
      try {
        const puppeteer = require('puppeteer');
        const browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setUserAgent(this.config.userAgent);
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        const html = await page.content();
        await browser.close();
        
        const $ = cheerio.load(html);
        return this.parseLinks($, baseUrlObj);
      } catch (browserError) {
        console.log(`⚠️  Failed to extract links from ${url}: ${browserError.message}`);
        return [];
      }
    }
  }

  /**
   * Parse links from HTML
   */
  parseLinks($, baseUrlObj) {
    const links = [];
    const seenUrls = new Set();
    
    $('a[href]').each((i, element) => {
      const href = $(element).attr('href');
      if (!href) return;
      
      try {
        let fullUrl;
        
        if (href.startsWith('http')) {
          fullUrl = new URL(href);
        } else if (href.startsWith('/')) {
          fullUrl = new URL(href, baseUrlObj.origin);
        } else {
          fullUrl = new URL(href, baseUrlObj.href);
        }
        
        // Only include links from the same domain
        if (fullUrl.hostname === baseUrlObj.hostname) {
          const urlString = fullUrl.href;
          
          if (!seenUrls.has(urlString)) {
            seenUrls.add(urlString);
            
            // Generate route path
            const route = fullUrl.pathname || '/';
            
            links.push({
              url: urlString,
              route: route
            });
          }
        }
      } catch (error) {
        // Skip invalid URLs
      }
    });
    
    return links;
  }

  /**
   * Check if page should be filtered out
   */
  shouldFilterPage(url, filter) {
    if (!filter || filter.length === 0) return false;
    
    const urlLower = url.toLowerCase();
    
    return filter.some(pattern => {
      if (typeof pattern === 'string') {
        return urlLower.includes(pattern.toLowerCase());
      }
      if (pattern instanceof RegExp) {
        return pattern.test(url);
      }
      return false;
    });
  }

  /**
   * Generate filename from route
   */
  generateFileName(route) {
    if (route === '/') {
      return 'index.md';
    }
    
    // Remove leading slash and convert to file path
    let fileName = route.replace(/^\//, '');
    
    // Handle dynamic routes and clean up the name
    fileName = fileName
      .replace(/[^a-zA-Z0-9\/\-_]/g, '-') // Replace special chars with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .replace(/\//g, '/'); // Keep forward slashes for subfolders
    
    // Add .md extension
    if (!fileName.endsWith('.md')) {
      fileName += '.md';
    }
    
    return fileName;
  }
}

module.exports = LinkParser;
