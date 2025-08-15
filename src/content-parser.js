const cheerio = require('cheerio');

/**
 * Content parsing utilities
 */

class ContentParser {
  /**
   * Extract title from HTML
   */
  extractTitle(html) {
    const $ = cheerio.load(html);
    const title = $('title').text().trim();
    return title || 'Untitled Page';
  }

  /**
   * Parse HTML content and extract structured content
   */
  parseContent(html, title) {
    const $ = cheerio.load(html);
    const content = [];

    // Detect JavaScript frameworks
    const hasReact = $('[data-reactroot], #root, #app').length > 0;
    const hasVue = $('[data-v-], #app').length > 0;
    const hasAngular = $('[ng-app], [ng-controller]').length > 0;

    if (hasReact || hasVue || hasAngular) {
      console.log('⚠️  Detected JavaScript framework (React/Vue/Angular)');
    }

    // Find main content area
    const contentSelectors = [
      'main',
      '[role="main"]',
      'article',
      '.content',
      '.post-content',
      '.entry-content',
      '.main-content',
      '#content',
      '#main'
    ];

    let $contentArea = null;
    for (const selector of contentSelectors) {
      $contentArea = $(selector);
      if ($contentArea.length > 0) {
        break;
      }
    }

    if (!$contentArea || $contentArea.length === 0) {
      $contentArea = $('body');
    }

    // Extract content in order
    this.extractContentInOrder($contentArea, content, $);

    return content;
  }

  /**
   * Extract content while preserving natural document order
   */
  extractContentInOrder($element, content, $) {
    $element.children().each((i, child) => {
      const $child = $(child);
      const tagName = $child[0].name;

      // Skip navigation and non-content elements
      if (this.shouldSkipElement($child, tagName)) {
        return;
      }

      switch (tagName) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          const headingText = $child.text().trim();
          if (headingText) {
            content.push({
              type: 'heading',
              text: headingText,
              tag: tagName,
              selector: this.generateSelector($child, $)
            });
          }
          break;

        case 'p':
          const paragraphText = $child.text().trim();
          if (paragraphText && paragraphText.length > 10) {
            content.push({
              type: 'paragraph',
              text: paragraphText,
              tag: 'p',
              selector: this.generateSelector($child, $)
            });
          }
          break;

        case 'ul':
        case 'ol':
          const listItems = [];
          $child.find('li').each((j, li) => {
            const itemText = $(li).text().trim();
            if (itemText) {
              listItems.push(itemText);
            }
          });

          if (listItems.length > 0) {
            content.push({
              type: 'list',
              items: listItems,
              tag: tagName,
              selector: this.generateSelector($child, $)
            });
          }
          break;

        case 'blockquote':
          const quoteText = $child.text().trim();
          if (quoteText) {
            content.push({
              type: 'blockquote',
              text: quoteText,
              tag: 'blockquote',
              selector: this.generateSelector($child, $)
            });
          }
          break;

        case 'pre':
        case 'code':
          const codeText = $child.text().trim();
          if (codeText) {
            content.push({
              type: 'code',
              text: codeText,
              tag: tagName,
              selector: this.generateSelector($child, $)
            });
          }
          break;

        case 'div':
          // For divs, check if they contain substantial text content
          const divText = $child.text().trim();
          if (divText.length > 50) {
            // Check if this div doesn't contain other extracted elements
            const hasExtractedChildren = $child.find('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre, code').length > 0;
            
            if (!hasExtractedChildren) {
              content.push({
                type: 'div',
                text: divText,
                tag: 'div',
                selector: this.generateSelector($child, $)
              });
            }
          }
          
          // Recursively process child elements to maintain order
          if ($child.children && $child.children().length > 0) {
            this.extractContentInOrder($child, content, $);
          }
          break;

        default:
          // For other elements, recursively process children
          if ($child.children && $child.children().length > 0) {
            this.extractContentInOrder($child, content, $);
          }
          break;
      }
    });
  }

  /**
   * Check if element should be skipped
   */
  shouldSkipElement($element, tagName) {
    const className = $element.attr('class') || '';
    const id = $element.attr('id') || '';
    const text = $element.text().trim();

    // Skip navigation elements
    const navPatterns = ['nav', 'menu', 'header', 'footer', 'sidebar', 'breadcrumb'];
    const hasNavClass = navPatterns.some(pattern => 
      className.toLowerCase().includes(pattern) || 
      id.toLowerCase().includes(pattern)
    );

    if (hasNavClass) return true;

    // Skip script and style tags
    if (tagName === 'script' || tagName === 'style') return true;

    // Skip empty elements
    if (text.length === 0) return true;

    return false;
  }

  /**
   * Generate CSS selector for element
   */
  generateSelector($element, $) {
    // Try to generate a unique CSS selector for the element
    const tagName = $element[0].name;
    const id = $element.attr('id');
    const classes = $element.attr('class');
    
    // If element has an ID, use it (most specific)
    if (id) {
      return `#${id}`;
    }
    
    // If element has classes, try to create a specific selector
    if (classes) {
      const classList = classes.split(' ').filter(c => c.trim());
      if (classList.length > 0) {
        // Use the first class that seems content-related
        const contentClasses = classList.filter(c => 
          !c.includes('nav') && 
          !c.includes('menu') && 
          !c.includes('header') && 
          !c.includes('footer') &&
          !c.includes('sidebar')
        );
        
        if (contentClasses.length > 0) {
          return `${tagName}.${contentClasses[0]}`;
        }
      }
    }
    
    // Generate a path-based selector as fallback
    const path = this.getElementPath($element, $);
    if (path) {
      return path;
    }
    
    // Last resort: tag name with nth-child
    const parent = $element.parent();
    if (parent.length > 0) {
      const siblings = parent.children(tagName);
      const index = siblings.index($element) + 1;
      return `${tagName}:nth-child(${index})`;
    }
    
    return tagName;
  }

  /**
   * Generate CSS path selector
   */
  getElementPath($element, $) {
    const path = [];
    let current = $element;
    
    while (current.length > 0 && current[0].name !== 'body') {
      const tagName = current[0].name;
      const id = current.attr('id');
      const classes = current.attr('class');
      
      let selector = tagName;
      
      if (id) {
        selector = `#${id}`;
        path.unshift(selector);
        break;
      } else if (classes) {
        const classList = classes.split(' ').filter(c => c.trim());
        if (classList.length > 0) {
          selector = `${tagName}.${classList[0]}`;
        }
      }
      
      path.unshift(selector);
      current = current.parent();
    }
    
    return path.join(' > ');
  }
}

module.exports = ContentParser;
