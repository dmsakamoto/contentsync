import * as cheerio from 'cheerio';

export interface SelectorInfo {
  cssSelector: string;
  xpath?: string;
  specificity: number;
  reliability: number;
}

export class SelectorBuilder {
  /**
   * Build a reliable CSS selector for an element
   */
  buildSelector($element: cheerio.Cheerio<cheerio.Element>): SelectorInfo {
    const element = $element[0];
    if (!element) {
      throw new Error('Element not found');
    }

    // Try different selector strategies in order of preference
    const strategies = [
      this.buildIdSelector.bind(this),
      this.buildClassSelector.bind(this),
      this.buildAttributeSelector.bind(this),
      this.buildPathSelector.bind(this),
    ];

    for (const strategy of strategies) {
      const selector = strategy($element);
      if (selector.cssSelector) {
        return selector;
      }
    }

    // Fallback to a basic path selector
    return this.buildPathSelector($element);
  }

  /**
   * Build selector using ID attribute
   */
  private buildIdSelector($element: cheerio.Cheerio<cheerio.Element>): SelectorInfo {
    const id = $element.attr('id');
    if (id && this.isValidId(id)) {
      return {
        cssSelector: `#${id}`,
        specificity: 100,
        reliability: 0.95,
      };
    }
    return { cssSelector: '', specificity: 0, reliability: 0 };
  }

  /**
   * Build selector using class attributes
   */
  private buildClassSelector($element: cheerio.Cheerio<cheerio.Element>): SelectorInfo {
    const className = $element.attr('class');
    if (!className) {
      return { cssSelector: '', specificity: 0, reliability: 0 };
    }

    const classes = className.split(/\s+/).filter(cls => cls.trim());
    if (classes.length === 0) {
      return { cssSelector: '', specificity: 0, reliability: 0 };
    }

    // Find unique classes that are specific to this element
    const uniqueClasses = this.findUniqueClasses($element, classes);
    
    if (uniqueClasses.length > 0) {
      const selector = `${$element.prop('tagName')?.toLowerCase()}.${uniqueClasses.join('.')}`;
      return {
        cssSelector: selector,
        specificity: 10 + uniqueClasses.length,
        reliability: 0.8,
      };
    }

    return { cssSelector: '', specificity: 0, reliability: 0 };
  }

  /**
   * Build selector using data attributes
   */
  private buildAttributeSelector($element: cheerio.Cheerio<cheerio.Element>): SelectorInfo {
    const dataAttrs = ['data-testid', 'data-id', 'data-content', 'data-component'];
    
    for (const attr of dataAttrs) {
      const value = $element.attr(attr);
      if (value) {
        return {
          cssSelector: `[${attr}="${value}"]`,
          specificity: 10,
          reliability: 0.9,
        };
      }
    }

    // Try role attribute
    const role = $element.attr('role');
    if (role) {
      return {
        cssSelector: `[role="${role}"]`,
        specificity: 10,
        reliability: 0.7,
      };
    }

    return { cssSelector: '', specificity: 0, reliability: 0 };
  }

  /**
   * Build selector using element path
   */
  private buildPathSelector($element: cheerio.Cheerio<cheerio.Element>): SelectorInfo {
    const path = this.getElementPath($element);
    return {
      cssSelector: path,
      xpath: this.buildXPath($element),
      specificity: 1,
      reliability: 0.6,
    };
  }

  /**
   * Get the element path from root
   */
  private getElementPath($element: cheerio.Cheerio<cheerio.Element>): string {
    const path: string[] = [];
    let current = $element;

    while (current.length > 0) {
      const tagName = current.prop('tagName')?.toLowerCase() || 'div';
      const className = current.attr('class');
      
      let selector = tagName;
      
      if (className) {
        const classes = className.split(/\s+/).filter(cls => cls.trim());
        if (classes.length > 0) {
          selector += `.${classes[0]}`; // Use first class for brevity
        }
      }

      // Add nth-child if there are siblings
      const siblings = current.siblings(tagName);
      if (siblings.length > 0) {
        const index = siblings.index(current) + 1;
        selector += `:nth-child(${index})`;
      }

      path.unshift(selector);
      current = current.parent();
    }

    return path.join(' > ');
  }

  /**
   * Build XPath for an element
   */
  private buildXPath($element: cheerio.Cheerio<cheerio.Element>): string {
    const element = $element[0];
    if (!element) return '';

    let xpath = '';
    let current = element;

    while (current && current.parent) {
      const tagName = current.tagName?.toLowerCase() || 'div';
      const parent = current.parent;
      
      if (parent.type === 'root') {
        xpath = `/${tagName}${xpath}`;
        break;
      }

      const siblings = parent.children.filter(child => 
        child.type === 'tag' && child.tagName === current.tagName
      );
      
      const index = siblings.indexOf(current) + 1;
      xpath = `/${tagName}[${index}]${xpath}`;
      
      current = parent;
    }

    return xpath;
  }

  /**
   * Find unique classes for an element
   */
  private findUniqueClasses($element: cheerio.Cheerio<cheerio.Element>, classes: string[]): string[] {
    const uniqueClasses: string[] = [];
    
    for (const cls of classes) {
      // Skip generic classes
      if (this.isGenericClass(cls)) {
        continue;
      }

      // Check if this class is unique within the document
      const $root = $element.root();
      const elementsWithClass = $root.find(`.${cls}`);
      
      if (elementsWithClass.length <= 3) { // Allow some flexibility
        uniqueClasses.push(cls);
      }
    }

    return uniqueClasses;
  }

  /**
   * Check if a class name is generic
   */
  private isGenericClass(className: string): boolean {
    const genericClasses = [
      'container', 'wrapper', 'content', 'main', 'section', 'div',
      'clear', 'clearfix', 'hidden', 'visible', 'active', 'inactive',
      'left', 'right', 'center', 'top', 'bottom', 'middle',
      'small', 'medium', 'large', 'big', 'tiny',
      'red', 'blue', 'green', 'yellow', 'black', 'white',
      'bold', 'italic', 'underline', 'strike',
      'margin', 'padding', 'border', 'background',
    ];

    return genericClasses.includes(className.toLowerCase());
  }

  /**
   * Check if an ID is valid
   */
  private isValidId(id: string): boolean {
    // ID should start with a letter and contain only letters, numbers, hyphens, and underscores
    return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(id);
  }

  /**
   * Test if a selector is unique in the document
   */
  testSelectorUniqueness(selector: string, $root: cheerio.Cheerio<cheerio.Root>): boolean {
    try {
      const elements = $root.find(selector);
      return elements.length === 1;
    } catch (error) {
      return false;
    }
  }

  /**
   * Build a more specific selector by adding context
   */
  buildContextualSelector(
    $element: cheerio.Cheerio<cheerio.Element>,
    contextLevels = 2
  ): SelectorInfo {
    const baseSelector = this.buildSelector($element);
    
    if (baseSelector.reliability >= 0.9) {
      return baseSelector;
    }

    // Add parent context
    let current = $element;
    let contextualSelector = baseSelector.cssSelector;
    let specificity = baseSelector.specificity;

    for (let i = 0; i < contextLevels && current.length > 0; i++) {
      current = current.parent();
      if (current.length > 0) {
        const parentSelector = this.buildSelector(current);
        if (parentSelector.cssSelector) {
          contextualSelector = `${parentSelector.cssSelector} > ${contextualSelector}`;
          specificity += parentSelector.specificity;
        }
      }
    }

    return {
      cssSelector: contextualSelector,
      specificity,
      reliability: Math.min(0.95, baseSelector.reliability + 0.1),
    };
  }
}
