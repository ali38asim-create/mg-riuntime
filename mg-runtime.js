/**
 * .flux Runtime Engine (v1.0.0)
 * - 100% Offline Compatible
 * - Transpiles f-prefix syntax to standard HTML/JS
 * - Reactive DOM updates & Event binding
 * - Safe template interpolation
 */
(function () {
  "use strict";

  class FluxRuntime {
    constructor() {
      this.store = {};
      this.reactiveFns = [];
      this.TAG_MAP = {
        'f1':'h1','f2':'h2','f3':'h3','f4':'h4','f5':'h5','f6':'h6',
        'fp':'p','fdiv':'div','fspan':'span','fa':'a','fimg':'img',
        'ful':'ul','fol':'ol','fli':'li','ftable':'table','ftr':'tr','ftd':'td','fth':'th',
        'fform':'form','finput':'input','fbutton':'button','flabel':'label',
        'fsection':'section','fheader':'header','ffooter':'footer','fnav':'nav',
        'fmain':'main','farticle':'article','faside':'aside','fcode':'code','fpre':'pre'
      };
      this.KEYWORD_MAP = {
        'flet':'let','fconst':'const','fvar':'var','ffn':'function',
        'fif':'if','felse':'else','ffor':'for','fwhile':'while','freturn':'return',
        'fclass':'class','fnew':'new','fthis':'this','fimport':'import','fexport':'export',
        'ftrue':'true','ffalse':'false','fnull':'null','fundefined':'undefined',
        'fconsole':'console','flog':'log','ferror':'error','fwarn':'warn',
        'fpublic':'public','fprivate':'private','fprotected':'protected',
        'fstatic':'static','fvoid':'void','fint':'int','fstring':'string',
        'fbool':'bool','fdouble':'double','ffloat':'float','flong':'long',
        'fshort':'short','fbyte':'byte','fchar':'char',
        'finterface':'interface','fextends':'extends','fimplements':'implements',
        'fnamespace':'namespace','fusing':'using','fpackage':'package',
        'ftry':'try','fcatch':'catch','fthrow':'throw','fasync':'async','fawait':'await'
      };
    }

    // 🔧 Transpile .flux syntax → Standard HTML/JS
    transpile(code) {
      let result = code;
      
      // 1. Replace HTML-like tags: <f1> → <h1>, </fp> → </p>
      result = result.replace(/<\/?f([a-zA-Z0-9_-]+)\b/g, (match) => {
        const tag = match.replace(/<\/?/, '').split(/\s|>/)[0];
        const stdTag = this.TAG_MAP[`f${tag}`] || `f${tag}`;
        return match.replace(`f${tag}`, stdTag);
      });

      // 2. Replace keywords: flet → let, ftrue → true (word boundaries only)
      for (const [flux, std] of Object.entries(this.KEYWORD_MAP)) {
        result = result.replace(new RegExp(`\\b${flux}\\b`, 'g'), std);
      }
      
      return result;
    }

    // 🔤 Safe Template Interpolation
    interpolate(template) {
      return template.replace(/\{([^}]+)\}/g, (_, expr) => {
        try {
          const keys = Object.keys(this.store);
          const values = Object.values(this.store);
          // Create a function with store keys as parameters
          return Function(...keys, `return (${expr})`)(...values) ?? expr;
        } catch {
          return expr; // Fallback: return literal if evaluation fails
        }
      });
    }

    // 🔄 Run all reactive DOM updates
    runReactives() {
      this.reactiveFns.forEach(fn => fn());
    }

    // 📖 Parse & Execute .flux Code
    execute(code) {
      const transpiled = this.transpile(code);

      // 1️⃣ Parse Variables (let x = ...)
      const letRegex = /let\s+(\w+)\s*=\s*([^;\n]+)/g;
      let match;
      while ((match = letRegex.exec(transpiled)) !== null) {
        const [, name, val] = match;
        try { this.store[name] = Function(`return ${val.trim()}`)(); }
        catch { this.store[name] = val.trim(); }
      }

      // 2️⃣ Parse Reactive Blocks (reactive var { render "sel" => `tpl` })
      const reactiveRegex = /reactive\s+(\w+)\s*\{([\s\S]*?)\n\s*\}/g;
      while ((match = reactiveRegex.exec(transpiled)) !== null) {
        const [, varName, body] = match;
        const renderRegex = /render\s+"([^"]+)"\s*=>\s*`([\s\S]*?)`/g;
        const renderers = [];
        let rMatch;
        while ((rMatch = renderRegex.exec(body)) !== null) {
          renderers.push({ selector: rMatch[1], template: rMatch[2] });
        }

        this.reactiveFns.push(() => {
          renderers.forEach(({ selector, template }) => {
            const el = document.querySelector(selector);
            if (el) el.innerHTML = this.interpolate(template);
          });
        });
      }

      // 3️⃣ Parse Event Bindings (on event "sel" { code })
      const eventRegex = /on\s+(\w+)\s+"([^"]+)"\s*\{([\s\S]*?)\n\s*\}/g;
      while ((match = eventRegex.exec(transpiled)) !== null) {
        const [, evt, selector, handlerCode] = match;
        const target = selector === 'document' ? document : document.querySelector(selector);
        if (!target) continue;

        target.addEventListener(evt, (e) => {
          const keys = Object.keys(this.store);
          // Wrap handler to inject store variables as local scope
          const wrapper = `
            let ${keys.join(', ')};
            (${keys.map((_, i) => `${keys[i]} = args[${i}]`).join(', ')})
            let event = e;
            ${handlerCode}
            // Sync local changes back to reactive store
            ${keys.map(k => `store["${k}"] = ${k};`).join('\n')}
          `;
          try {
            Function('args', 'e', 'store', wrapper)(
              Object.values(this.store), e, this.store
            );
          } catch (err) {
            console.error(`[.flux] Error in "${evt}" handler for "${selector}":`, err);
          }
          this.runReactives();
        });
      }

      // 🚀 Initial Render
      this.runReactives();
    }

    // 🌐 DOM Initialization
    init() {
      const fluxTags = document.querySelectorAll('flux');
      fluxTags.forEach(fluxTag => {
        const rawCode = fluxTag.textContent.trim();
        if (!rawCode) return;

        try {
          this.execute(rawCode);
          // Clean up: remove <flux> tag after processing
          fluxTag.remove();
        } catch (err) {
          console.error('[.flux] Initialization failed:', err);
          fluxTag.textContent = `⚠️ .flux Error: ${err.message}`;
        }
      });
    }
  }

  // 🟢 Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FluxRuntime().init());
  } else {
    new FluxRuntime().init();
  }

  // Expose global API (optional, for advanced usage)
  window.Flux = {
    create: () => new FluxRuntime(),
    VERSION: '1.0.0'
  };
})();
