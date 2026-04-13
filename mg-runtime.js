/**
by asim ali
 * .flux Full-Stack Runtime (v2.0.0)
 * - Auto-generates HTML/CSS/JS from <flux> tags
 * - Offline-compatible with CDN fallback
 * - Renamed tags: f1→h1, fstyle→<style>, fapi→mock backend
 */
(function(global) {
  "use strict";

  class FluxEngine {
    constructor() {
      this.store = { count: 0, userName: "" };
      this.reactiveFns = [];
      this.apiMock = {};
      
      // Tag & Keyword Maps
      this.TAGS = {
        'f1':'h1','f2':'h2','f3':'h3','f4':'h4','f5':'h5','f6':'h6',
        'fp':'p','fdiv':'div','fspan':'span','fa':'a','fimg':'img',
        'ful':'ul','fol':'ol','fli':'li','ftable':'table','ftr':'tr','ftd':'td','fth':'th',
        'fform':'form','finput':'input','fbutton':'button','flabel':'label',
        'fsection':'section','fheader':'header','ffooter':'footer','fnav':'nav',
        'fmain':'main','farticle':'article','faside':'aside','fcode':'code','fpre':'pre',
        'fstyle':'style','fscript':'script'
      };
      
      this.KEYWORDS = {
        'flet':'let','fconst':'const','fvar':'var','ffn':'function',
        'fif':'if','felse':'else','ffor':'for','fwhile':'while','freturn':'return',
        'fclass':'class','fnew':'new','fthis':'this','fimport':'import','fexport':'export',
        'ftrue':'true','ffalse':'false','fnull':'null','fundefined':'undefined',
        'fconsole':'console','flog':'log','ferror':'error','fwarn':'warn',
        'fpublic':'public','fprivate':'private','fprotected':'protected',
        'fstatic':'static','fvoid':'void','fint':'int','fstring':'string',
        'fbool':'bool','fdouble':'double','ffloat':'float','flong':'long',
        'fshort':'short','fbyte':'byte','fchar':'char','fobject':'Object',
        'fPromise':'Promise','fsetTimeout':'setTimeout','fDate':'Date',
        'fMath':'Math','frandom':'random','fapi':'this.apiMock'
      };
    }

    // 🔧 Transpile .flux → Standard Code
    transpile(code) {
      let r = code;
      
      // 1. Tags: <f1> → <h1>, <fstyle> → <style>
      r = r.replace(/<\/?f([a-zA-Z0-9_-]+)\b/g, match => {
        const tag = match.replace(/<\/?/, '').split(/[\s>]/)[0];
        const std = this.TAGS[`f${tag}`];
        return std ? match.replace(`f${tag}`, std) : match;
      });

      // 2. Keywords: flet → let, fapi → this.apiMock
      for (const [flux, std] of Object.entries(this.KEYWORDS)) {
        r = r.replace(new RegExp(`\\b${flux}\\b`, 'g'), std);
      }

      // 3. Block syntax: fdiv class="x" { ... } → <div class="x"> ... </div>
      r = r.replace(/f([a-zA-Z0-9_-]+)\s+([^{}]+?)\s*\{([\s\S]*?)\n\s*\}/g, (_, tag, attrs, content) => {
        const stdTag = this.TAGS[`f${tag}`] || `f${tag}`;
        return `<${stdTag} ${attrs.trim()}>${content.trim()}</${stdTag}>`;
      });

      return r;
    }

    // 🔤 Safe Template Interpolation
    interpolate(tpl) {
      return tpl.replace(/\{([^}]+)\}/g, (_, expr) => {
        try {
          const keys = Object.keys(this.store);
          const vals = Object.values(this.store);
          return Function(...keys, `return (${expr})`)(...vals) ?? expr;
        } catch { return expr; }
      });
    }

    // 🔄 Run Reactive Updates
    runReactives() {
      this.reactiveFns.forEach(fn => fn());
    }

    // 📖 Execute .flux Code
    execute(code) {
      const js = this.transpile(code);

      // 1️⃣ Parse Variables
      js.match(/let\s+(\w+)\s*=\s*([^;\n]+)/g)?.forEach(m => {
        const [, name, val] = m.match(/let\s+(\w+)\s*=\s*([^;\n]+)/);
        try { this.store[name] = Function(`return ${val.trim()}`)(); }
        catch { this.store[name] = val.trim(); }
      });

      // 2️⃣ Parse Reactive Blocks
      [...js.matchAll(/reactive\s+(\w+)\s*\{([\s\S]*?)\n\s*\}/g)].forEach(([, v, body]) => {
        const renders = [...body.matchAll(/render\s+"([^"]+)"\s*=>\s*`([\s\S]*?)`/g)];
        this.reactiveFns.push(() => {
          renders.forEach(([, sel, tpl]) => {
            const el = document.querySelector(sel);
            if (el) el.innerHTML = this.interpolate(tpl);
          });
        });
      });

      // 3️⃣ Parse Events
      [...js.matchAll(/on\s+(\w+)\s+"([^"]+)"\s*\{([\s\S]*?)\n\s*\}/g)].forEach(([, evt, sel, body]) => {
        const target = sel === 'document' ? document : document.querySelector(sel);
        if (!target) return;
        target.addEventListener(evt, (e) => {
          const keys = Object.keys(this.store);
          try {
            Function('args','e','store',`
              let ${keys.join(',')};
              ${keys.map((_,i)=>`${keys[i]}=args[${i}]`).join(',')}
              let event=e;
              ${body}
              ${keys.map(k=>`store["${k}"]=${k};`).join('')}
            `)(Object.values(this.store), e, this.store);
          } catch(err) { console.error('[.flux]', err); }
          this.runReactives();
        });
      });

      // 4️⃣ Execute Global Code (styles, api, helpers)
      try {
        // Create safe scope with store + DOM + apiMock
        const scope = {
          ...this.store,
          document, window, console,
          apiMock: this.apiMock,
          render: (sel, fn) => {
            const el = document.querySelector(sel);
            if (el && typeof fn === 'function') {
              el.innerHTML = this.interpolate(fn());
            }
          }
        };
        Function(...Object.keys(scope), js)(...Object.values(scope));
      } catch(err) {
        console.warn('[.flux] Global execution note:', err.message);
      }

      // 🚀 Initial Render
      this.runReactives();
    }

    // 🌐 Bootstrap the Page
    bootstrap(fluxCode) {
      // Auto-inject missing HTML structure if needed
      if (!document.documentElement.lang) {
        document.documentElement.lang = 'en';
      }
      if (!document.querySelector('meta[charset]')) {
        const meta = document.createElement('meta');
        meta.charset = 'UTF-8';
        document.head.prepend(meta);
      }

      // Execute .flux code
      this.execute(fluxCode);
    }

    // 🚀 Initialize
    init() {
      const fluxTags = document.querySelectorAll('flux');
      
      fluxTags.forEach(fluxTag => {
        const src = fluxTag.getAttribute('src');
        
        const load = (code) => {
          this.bootstrap(code.trim());
          fluxTag.remove(); // Clean up after processing
        };

        if (src) {
          // External file (works on http:// or with fallback)
          fetch(src)
            .then(r => r.text())
            .then(load)
            .catch(err => {
              console.warn(`[.flux] Failed to load "${src}":`, err);
              fluxTag.textContent = `⚠️ Could not load "${src}". Check path and CORS.`;
            });
        } else {
          // Inline code
          load(fluxTag.textContent);
        }
      });
    }
  }

  // 🟢 Auto-start when DOM ready
  const start = () => new FluxEngine().init();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // 🌍 Expose global API
  global.Flux = {
    create: () => new FluxEngine(),
    VERSION: '2.0.0'
  };

})(typeof window !== 'undefined' ? window : global);
