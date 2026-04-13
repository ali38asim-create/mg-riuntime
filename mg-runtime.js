/**
 * Meta-Lang Runtime (v1.0.0)
 * Processes <meta-lang> tags with custom syntax:
 * - print ("message") → renders styled output
 * - style("name", "css") → injects dynamic styles
 * - backend ... → simulated server-side processing
 * - frontend ... → client-side rendering
 */
(function(global) {
  "use strict";

  class MetaLangEngine {
    constructor() {
      this.styleRegistry = new Map();
      this.backendLogs = [];
      this.outputContainer = null;
    }

    // Create and inject the runtime output container
    ensureOutputContainer() {
      if (!this.outputContainer) {
        // Look for existing container
        this.outputContainer = document.querySelector('.metalang-runtime');
        if (!this.outputContainer) {
          this.outputContainer = document.createElement('div');
          this.outputContainer.className = 'metalang-runtime';
          // Insert after the last meta-lang tag or at body end
          const lastTag = document.querySelector('meta-lang');
          if (lastTag && lastTag.parentNode) {
            lastTag.parentNode.insertBefore(this.outputContainer, lastTag.nextSibling);
          } else {
            document.body.appendChild(this.outputContainer);
          }
        }
      }
      return this.outputContainer;
    }

    // Parse and execute a single <meta-lang> block
    parseBlock(code, hasBackendAttr = false) {
      const lines = code.split('\n');
      const frontendOutputs = [];
      const backendCommands = [];
      
      let currentStyleName = null;
      let currentStyleCSS = '';

      for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('//')) continue;

        // Match: print ("message")
        const printMatch = line.match(/print\s*\(\s*["'`](.*?)["'`]\s*\)/);
        if (printMatch) {
          const message = printMatch[1];
          frontendOutputs.push({
            type: 'print',
            content: message,
            style: currentStyleName
          });
          continue;
        }

        // Match: style("name", "css rules")
        const styleMatch = line.match(/style\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']*)["']\s*\)/);
        if (styleMatch) {
          const [, name, css] = styleMatch;
          this.registerStyle(name, css);
          currentStyleName = name;
          currentStyleCSS = css;
          continue;
        }

        // Match: backend ... (explicit backend command)
        if (line.toLowerCase().startsWith('backend')) {
          const command = line.substring(7).trim();
          backendCommands.push(command);
          continue;
        }

        // Match: frontend ... (explicit frontend)
        if (line.toLowerCase().startsWith('frontend')) {
          const command = line.substring(8).trim();
          // Could execute frontend-specific logic here
          console.log('[MetaLang Frontend]', command);
          continue;
        }

        // Any other line — treat as potential backend if block has backend attribute
        if (hasBackendAttr) {
          backendCommands.push(line);
        }
      }

      return { frontendOutputs, backendCommands };
    }

    // Register a named style
    registerStyle(name, css) {
      if (!this.styleRegistry.has(name)) {
        this.styleRegistry.set(name, css);
        // Inject as a dynamic style tag
        const styleEl = document.createElement('style');
        styleEl.textContent = `.ml-style-${name} { ${css} }`;
        document.head.appendChild(styleEl);
      }
    }

    // Simulate backend processing
    processBackend(commands) {
      if (commands.length === 0) return null;
      
      const results = [];
      const timestamp = new Date().toLocaleTimeString();
      
      commands.forEach(cmd => {
        // Simulate common backend operations
        if (cmd.includes('fetch') || cmd.includes('connect')) {
          results.push(`⚡ ${cmd} → simulated async operation`);
        } else if (cmd.includes('log') || cmd.includes('print')) {
          const logMatch = cmd.match(/(?:log|print)\s*\(\s*["'](.*?)["']\s*\)/);
          if (logMatch) {
            results.push(`📋 ${logMatch[1]}`);
          } else {
            results.push(`📋 ${cmd}`);
          }
        } else if (cmd.includes('compute') || cmd.includes('process')) {
          results.push(`🔄 ${cmd} → computation complete (simulated)`);
        } else {
          results.push(`⚙️ ${cmd}`);
        }
      });

      this.backendLogs.push({ timestamp, commands: results });
      return results;
    }

    // Render frontend outputs to the container
    renderFrontend(outputs, blockElement) {
      const container = this.ensureOutputContainer();
      
      outputs.forEach(output => {
        const wrapper = document.createElement('div');
        wrapper.className = 'ml-card';
        
        if (output.style) {
          wrapper.classList.add(`ml-style-${output.style}`);
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'ml-text';
        contentDiv.textContent = output.content;
        
        wrapper.appendChild(contentDiv);
        container.appendChild(wrapper);
      });

      // If no frontend outputs but we have a block element, we might want to
      // indicate that backend processing occurred
    }

    // Render backend panel
    renderBackendPanel(backendResults, blockElement) {
      if (!backendResults || backendResults.length === 0) return;

      const container = this.ensureOutputContainer();
      const panel = document.createElement('div');
      panel.className = 'ml-backend-panel';
      
      const title = document.createElement('div');
      title.style.marginBottom = '12px';
      title.style.color = '#b1a5ff';
      title.style.fontWeight = '600';
      title.textContent = `⚙️ backend · ${new Date().toLocaleTimeString()}`;
      panel.appendChild(title);

      backendResults.forEach(line => {
        const lineEl = document.createElement('div');
        lineEl.className = 'ml-output-line';
        lineEl.style.margin = '6px 0';
        lineEl.textContent = line;
        panel.appendChild(lineEl);
      });

      container.appendChild(panel);
    }

    // Process all <meta-lang> tags
    processAllTags() {
      const tags = document.querySelectorAll('meta-lang');
      
      tags.forEach(tag => {
        const code = tag.textContent.trim();
        const hasBackendAttr = tag.hasAttribute('backend');
        const type = tag.getAttribute('type') || 'default';

        // Parse the block
        const { frontendOutputs, backendCommands } = this.parseBlock(code, hasBackendAttr);

        // Process backend if any commands
        let backendResults = null;
        if (backendCommands.length > 0) {
          backendResults = this.processBackend(backendCommands);
        }

        // Render frontend outputs
        if (frontendOutputs.length > 0) {
          this.renderFrontend(frontendOutputs, tag);
        }

        // Render backend panel if there are results
        if (backendResults) {
          this.renderBackendPanel(backendResults, tag);
        }

        // Optional: remove or hide the original tag
        // tag.style.display = 'none'; // uncomment to hide source tags
      });
    }

    // Initialize the runtime
    init() {
      // Add base styles if not present
      if (!document.querySelector('style[data-metalang-base]')) {
        const baseStyle = document.createElement('style');
        baseStyle.setAttribute('data-metalang-base', 'true');
        baseStyle.textContent = `
          .metalang-runtime {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
          }
          .ml-card {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(10px);
            border-radius: 24px;
            padding: 1.5rem 2rem;
            margin: 1.5rem 0;
            border: 1px solid rgba(100, 80, 200, 0.15);
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
          }
          .ml-text {
            font-size: 1.2rem;
            line-height: 1.6;
            color: #1e1a3a;
          }
          .ml-backend-panel {
            background: #1a1730;
            border-radius: 20px;
            padding: 1.2rem 1.8rem;
            color: #d0c8ff;
            font-family: monospace;
            margin: 1.5rem 0;
            border-left: 6px solid #7c6cf0;
          }
          .ml-output-line {
            margin: 0.25rem 0;
            padding: 0.1rem 0;
          }
        `;
        document.head.appendChild(baseStyle);
      }

      this.processAllTags();
    }
  }

  // Auto-start when DOM is ready
  const engine = new MetaLangEngine();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => engine.init());
  } else {
    engine.init();
  }

  // Expose for manual execution
  global.MetaLang = {
    process: () => engine.processAllTags(),
    version: '1.0.0'
  };

})(typeof window !== 'undefined' ? window : global);
