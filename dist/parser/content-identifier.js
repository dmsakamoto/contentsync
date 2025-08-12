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
exports.ContentIdentifier = void 0;
const cheerio = __importStar(require("cheerio"));
class ContentIdentifier {
    constructor(config) {
        this.config = config;
    }
    /**
     * Find main content areas in the HTML
     */
    findContentAreas(html) {
        const $ = cheerio.load(html);
        const contentAreas = [];
        // Remove script and style tags
        $('script, style, noscript').remove();
        // Find content areas using configured selectors
        for (const selector of this.config.contentSelectors) {
            const elements = $(selector);
            elements.each((_, element) => {
                const $element = $(element);
                const score = this.calculateContentScore($element);
                if (score > 0) {
                    contentAreas.push({
                        element: $element,
                        selector,
                        score,
                        type: this.getElementType(selector),
                    });
                }
            });
        }
        // Sort by score (highest first)
        contentAreas.sort((a, b) => b.score - a.score);
        // Filter out overlapping areas
        return this.filterOverlappingAreas(contentAreas);
    }
    /**
     * Calculate a score for how likely an element is to contain main content
     */
    calculateContentScore($element) {
        let score = 0;
        // Base score for semantic elements
        const tagName = $element.prop('tagName')?.toLowerCase();
        switch (tagName) {
            case 'main':
                score += 100;
                break;
            case 'article':
                score += 80;
                break;
            case 'section':
                score += 60;
                break;
            case 'div':
                score += 20;
                break;
        }
        // Score based on text content length
        const textContent = $element.text().trim();
        const textLength = textContent.length;
        if (textLength > 1000)
            score += 50;
        else if (textLength > 500)
            score += 30;
        else if (textLength > 100)
            score += 10;
        // Score based on heading presence
        const headingCount = $element.find('h1, h2, h3, h4, h5, h6').length;
        score += headingCount * 10;
        // Score based on paragraph presence
        const paragraphCount = $element.find('p').length;
        score += paragraphCount * 5;
        // Penalty for navigation-like content
        if (this.isNavigationElement($element)) {
            score -= 100;
        }
        // Penalty for small content areas
        if (textLength < 50) {
            score -= 50;
        }
        // Penalty for elements with mostly links
        const linkCount = $element.find('a').length;
        const totalElements = $element.find('*').length;
        if (totalElements > 0 && linkCount / totalElements > 0.5) {
            score -= 30;
        }
        return Math.max(0, score);
    }
    /**
     * Check if an element is likely navigation
     */
    isNavigationElement($element) {
        const tagName = $element.prop('tagName')?.toLowerCase();
        const className = $element.attr('class') || '';
        const id = $element.attr('id') || '';
        const role = $element.attr('role') || '';
        // Check tag name
        if (tagName === 'nav')
            return true;
        // Check role attribute
        if (role === 'navigation')
            return true;
        // Check class names
        const navClasses = ['nav', 'navigation', 'menu', 'navbar', 'header', 'footer', 'sidebar'];
        if (navClasses.some(navClass => className.toLowerCase().includes(navClass))) {
            return true;
        }
        // Check ID
        if (navClasses.some(navClass => id.toLowerCase().includes(navClass))) {
            return true;
        }
        // Check for excluded selectors
        for (const excludeSelector of this.config.excludeSelectors) {
            if ($element.is(excludeSelector)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Get the type of element based on selector
     */
    getElementType(selector) {
        if (selector === 'main')
            return 'main';
        if (selector === 'article')
            return 'article';
        if (selector === 'section')
            return 'section';
        return 'div';
    }
    /**
     * Filter out overlapping content areas
     */
    filterOverlappingAreas(areas) {
        const filtered = [];
        for (const area of areas) {
            let isOverlapping = false;
            for (const existing of filtered) {
                if (this.areElementsOverlapping(area.element, existing.element)) {
                    isOverlapping = true;
                    break;
                }
            }
            if (!isOverlapping) {
                filtered.push(area);
            }
        }
        return filtered;
    }
    /**
     * Check if two elements overlap
     */
    areElementsOverlapping($element1, $element2) {
        // Check if one element contains the other
        if ($element1.find($element2).length > 0)
            return true;
        if ($element2.find($element1).length > 0)
            return true;
        // Check if they are the same element
        if ($element1.is($element2))
            return true;
        return false;
    }
    /**
     * Get the best content area (highest scoring non-overlapping area)
     */
    getBestContentArea(html) {
        const areas = this.findContentAreas(html);
        return areas.length > 0 ? areas[0] : null;
    }
    /**
     * Check if an element should be excluded based on configuration
     */
    shouldExcludeElement($element) {
        // Check excluded selectors
        for (const excludeSelector of this.config.excludeSelectors) {
            if ($element.is(excludeSelector)) {
                return true;
            }
        }
        // Check if it's navigation (unless explicitly included)
        if (!this.config.includeNavigation && this.isNavigationElement($element)) {
            return true;
        }
        return false;
    }
}
exports.ContentIdentifier = ContentIdentifier;
//# sourceMappingURL=content-identifier.js.map