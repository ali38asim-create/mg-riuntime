/**
 * Meta-Lang Natural Language Runtime (v2.0.0)
 * Processes natural English tags like <hero-section>, <feature-card>, etc.
 * Converts them to proper HTML with styling
 */
(function(global) {
  "use strict";

  class NaturalLanguageEngine {
    constructor() {
      this.styles = new Map();
      this.processedTags = new Set();
    }

    // Tag mapping - natural language to HTML
    TAG_MAP = {
      // Structure tags
      'page': 'div',
      'head-section': 'head',
      'body-section': 'div',
      'page-header': 'header',
      'page-footer': 'footer',
      
      // Navigation
      'navigation': 'nav',
      'nav-brand': 'div',
      'nav-menu': 'ul',
      'nav-item': 'li',
      'nav-button': 'button',
      
      // Hero
      'hero-section': 'section',
      'hero-title': 'h1',
      'hero-subtitle': 'h2',
      'hero-description': 'p',
      'highlight': 'span',
      
      // Buttons
      'button-group': 'div',
      'primary-button': 'button',
      'secondary-button': 'button',
      
      // Stats
      'stats-display': 'div',
      'stat-item': 'div',
      'stat-number': 'div',
      'stat-label': 'div',
      
      // Sections
      'section-container': 'section',
      'section-heading': 'div',
      'heading-title': 'h2',
      'heading-description': 'p',
      
      // Features
      'feature-grid': 'div',
      'feature-card': 'div',
      'card-icon': 'div',
      'card-title': 'h3',
      'card-text': 'p',
      'card-badge': 'span',
      
      // Showcase
      'showcase-section': 'section',
      'showcase-grid': 'div',
      'showcase-item': 'div',
      'showcase-preview': 'div',
      'preview-content': 'div',
      'mini-browser': 'div',
      'browser-bar': 'div',
      'mini-page': 'div',
      'mini-heading': 'h4',
      'mini-button': 'button',
      'mini-dashboard': 'div',
      'dashboard-chart': 'div',
      'dashboard-stats': 'div',
      'mini-store': 'div',
      'product-image': 'div',
      'product-price': 'div',
      'showcase-title': 'h3',
      'showcase-tags': 'p',
      
      // Pricing
      'pricing-container': 'div',
      'pricing-plan': 'div',
      'popular-badge': 'span',
      'plan-name': 'h3',
      'plan-price': 'div',
      'plan-period': 'span',
      'plan-description': 'p',
      'feature-list': 'ul',
      'feature-item': 'li',
      'plan-button': 'button',
      
      // Testimonials
      'testimonial-section': 'section',
      'testimonial-carousel': 'div',
      'testimonial-card': 'div',
      'testimonial-text': 'p',
      'author-info': 'div',
      'author-avatar': 'div',
      'author-details': 'div',
      'author-name': 'div',
      'author-title': 'div',
      
      // CTA
      'cta-section': 'section',
      'cta-container': 'div',
      'cta-title': 'h2',
      'cta-description': 'p',
      'cta-button-group': 'div',
      'primary-cta': 'button',
      'secondary-cta': 'button',
      'cta-note': 'p',
      
      // Footer
      'footer-content': 'div',
      'footer-section': 'div',
      'footer-heading': 'h4',
      'footer-links': 'ul',
      'footer-link': 'li',
      'footer-bottom': 'div',
      'copyright': 'p',
      'social-links': 'div',
      'social-icon': 'span',
      
      // Meta
      'title-text': 'title',
      'description': 'meta'
    };

    // Process natural language tags
    processNaturalTags() {
      const allElements = document.querySelectorAll('*');
      const customTags = new Set();
      
      // Find all custom tags
      allElements.forEach(el => {
        const tagName = el.tagName.toLowerCase();
        if (this.TAG_MAP[tagName] && !this.processedTags.has(el)) {
          customTags.add(tagName);
        }
      });

      // Replace each custom tag with proper HTML
      Object.keys(this.TAG_MAP).forEach(customTag => {
        const elements = document.querySelectorAll(customTag);
        elements.forEach(el => {
          if (this.processedTags.has(el)) return;
          
          const htmlTag = this.TAG_MAP[customTag];
          const newEl = document.createElement(htmlTag);
          
          // Copy attributes
          Array.from(el.attributes).forEach(attr => {
            newEl.setAttribute(attr.name, attr.value);
          });
          
          // Add appropriate classes
          newEl.classList.add(`nl-${customTag}`);
          
          // Copy content
          while (el.firstChild) {
            newEl.appendChild(el.firstChild);
          }
          
          // Special handling for certain tags
          if (customTag === 'description') {
            newEl.setAttribute('name', 'description');
          }
          
          if (customTag === 'nav-menu' || customTag === 'feature-list' || customTag === 'footer-links') {
            // Ensure list items are properly wrapped
            const items = Array.from(newEl.children);
            items.forEach(item => {
              if (item.tagName !== 'LI') {
                const li = document.createElement('li');
                while (item.firstChild) {
                  li.appendChild(item.firstChild);
                }
                item.replaceWith(li);
              }
            });
          }
          
          // Replace the custom element
          el.replaceWith(newEl);
          this.processedTags.add(newEl);
        });
      });
    }

    // Process meta-lang style definitions
    processMetaLangStyles() {
      const metaTags = document.querySelectorAll('meta-lang');
      
      metaTags.forEach(tag => {
        const content = tag.textContent;
        const lines = content.split('\n');
        
        lines.forEach(line => {
          // Match style("name", "css")
          const styleMatch = line.match(/style\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']*)["']\s*\)/);
          if (styleMatch) {
            const [, name, css] = styleMatch;
            this.injectStyle(name, css);
          }
        });
      });
    }

    // Inject styles into document
    injectStyle(name, css) {
      if (this.styles.has(name)) return;
      
      const styleEl = document.createElement('style');
      styleEl.textContent = css;
      styleEl.setAttribute('data-metalang-style', name);
      document.head.appendChild(styleEl);
      this.styles.set(name, css);
    }

    // Process backend commands
    processBackendCommands() {
      const backendTags = document.querySelectorAll('meta-lang[backend]');
      const container = document.querySelector('.metalang-runtime') || this.createRuntimeContainer();
      
      backendTags.forEach(tag => {
        const content = tag.textContent;
        const lines = content.split('\n');
        const backendCommands = [];
        
        lines.forEach(line => {
          if (line.includes('backend log') || line.includes('backend initialize') || 
              line.includes('backend load') || line.includes('backend setup') ||
              line.includes('backend enable') || line.includes('backend start')) {
            
            let command = line.trim();
            if (command.startsWith('backend ')) {
              command = command.substring(8);
            }
            backendCommands.push(command);
          }
        });
        
        if (backendCommands.length > 0) {
          this.renderBackendPanel(backendCommands, container);
        }
      });
    }

    // Create runtime container
    createRuntimeContainer() {
      const container = document.createElement('div');
      container.className = 'metalang-runtime';
      document.body.appendChild(container);
      return container;
    }

    // Render backend panel
    renderBackendPanel(commands, container) {
      const panel = document.createElement('div');
      panel.className = 'ml-backend-panel';
      panel.style.cssText = `
        background: #1a1730;
        border-radius: 20px;
        padding: 1.5rem;
        color: #d0c8ff;
        font-family: monospace;
        margin: 2rem auto;
        max-width: 1400px;
        border-left: 6px solid #7c6cf0;
      `;
      
      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid rgba(124, 108, 240, 0.3);
      `;
      header.innerHTML = `
        <span style="font-size: 1.2rem;">⚙️</span>
        <span style="font-weight: 600; color: #b1a5ff;">backend · ${new Date().toLocaleTimeString()}</span>
      `;
      panel.appendChild(header);
      
      commands.forEach(cmd => {
        const line = document.createElement('div');
        line.style.cssText = 'margin: 0.3rem 0; padding: 0.2rem 0;';
        
        if (cmd.includes('log')) {
          const match = cmd.match(/log\s*\(\s*["'](.*?)["']\s*\)/);
          if (match) {
            line.innerHTML = `<span style="color: #7c6cf0;">📋</span> <span style="color: #e3d9ff;">${match[1]}</span>`;
          } else {
            line.innerHTML = `<span style="color: #7c6cf0;">📋</span> <span style="color: #e3d9ff;">${cmd}</span>`;
          }
        } else {
          line.innerHTML = `<span style="color: #9f8eff;">⚙️</span> <span style="color: #c8bfff;">${cmd}</span>`;
        }
        
        panel.appendChild(line);
      });
      
      container.appendChild(panel);
    }

    // Add base styles for natural language elements
    injectBaseStyles() {
      const baseStyles = `
        /* Base styles for natural language elements */
        [class*="nl-"] {
          box-sizing: border-box;
        }
        
        .nl-page {
          max-width: 100%;
        }
        
        .nl-nav-menu {
          display: flex;
          gap: 2rem;
          list-style: none;
        }
        
        .nl-nav-item {
          cursor: pointer;
        }
        
        .nl-feature-list {
          list-style: none;
        }
        
        .nl-footer-links {
          list-style: none;
        }
        
        /* Hide meta-lang tags */
        meta-lang {
          display: none;
        }
      `;
      
      const styleEl = document.createElement('style');
      styleEl.textContent = baseStyles;
      document.head.appendChild(styleEl);
    }

    // Initialize everything
    init() {
      // Process meta-lang styles first
      this.processMetaLangStyles();
      
      // Add base styles
      this.injectBaseStyles();
      
      // Convert natural language tags to HTML
      this.processNaturalTags();
      
      // Process backend commands
      this.processBackendCommands();
      
      // Hide original meta-lang tags
      document.querySelectorAll('meta-lang').forEach(tag => {
        tag.style.display = 'none';
      });
      
      console.log('✨ Natural Language Runtime initialized');
    }
  }

  // Auto-start when DOM is ready
  const engine = new NaturalLanguageEngine();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => engine.init());
  } else {
    engine.init();
  }

  // Expose global API
  global.NaturalLang = {
    refresh: () => engine.init(),
    version: '2.0.0'
  };

})(typeof window !== 'undefined' ? window : global);
