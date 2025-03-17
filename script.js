import "https://unpkg.com/prismjs@1.30.0/prism.js";
import { DEFAULTS } from "./defaults.js";

// Only execute highlighting if the browser supports CSS.highlights
if (CSS.highlights) {
  /**
   * @typedef {Object} PrismToken
   * @property {string} [type] - Token type
   * @property {string} [alias] - Alternative token type
   * @property {number} length - Length of the token text
   */

  const tokenTypes = [
    "comment",
    "prolog",
    "doctype",
    "cdata",
    "punctuation",
    "namespace",
    "property",
    "tag",
    "boolean",
    "number",
    "constant",
    "symbol",
    "deleted",
    "selector",
    "attr",
    "string",
    "char",
    "builtin",
    "inserted",
    "operator",
    "entity",
    "url",
    "atrule",
    "keyword",
    "function",
    "class",
    "regex",
    "important",
    "variable",
    "bold",
    "italic",
    "parameter",
    "class-name",
  ];

  // Register highlights for all token types
  tokenTypes.forEach((tokenType) => {
    CSS.highlights.set(tokenType, new Highlight());
  });

  /**
   * Safely normalizes text nodes in an element
   * @param {HTMLElement} element - The element to normalize
   */
  const flattenTextNodes = (element) => {
    element.normalize();
  };

  /**
   * Applies syntax highlighting to tokens
   * @param {HTMLElement} codeBlock - The element containing code
   * @param {PrismToken[]} tokens - Array of tokens from Prism.tokenize
   */
  const paintTokenHighlights = (codeBlock, tokens) => {
    if (!codeBlock.firstChild || !tokens.length) {
      return;
    }

    const textLength = codeBlock.firstChild.textContent.length;
    let pos = 0;

    for (const token of tokens) {
      if (token.type) {
        try {
          // Ensure we don't create ranges beyond the text length
          if (pos >= textLength) {
            break;
          }

          const endPos = Math.min(pos + token.length, textLength);
          const range = new Range();
          range.setStart(codeBlock.firstChild, pos);
          range.setEnd(codeBlock.firstChild, endPos);
          CSS.highlights.get(token.alias ?? token.type)?.add(range);
        } catch (error) {
          console.warn("Error highlighting token:", error);
          // Continue with next token
        }
      }
      pos += token.length;
    }
  };

  /**
   * Highlights code in an element using Prism
   * @param {HTMLElement} codeBlock - The element containing code
   * @param {Object} lang - The Prism language object to use for tokenizing
   */
  const highlight = (codeBlock, lang = Prism.languages.javascript) => {
    try {
      if (!codeBlock || !codeBlock.innerText) {
        return;
      }
      if (codeBlock.firstChild) {
        flattenTextNodes(codeBlock);
      }

      if (!codeBlock.firstChild) {
        codeBlock.appendChild(document.createTextNode(codeBlock.innerText));
      }

      // Ensure the inner text and text node are synchronized
      if (codeBlock.firstChild.textContent !== codeBlock.innerText) {
        // codeBlock.firstChild.textContent = codeBlock.innerText;
      }

      const tokens = Prism.tokenize(codeBlock.innerText, lang);

      // Clear all current highlights
      tokenTypes.forEach((tokenType) => {
        CSS.highlights.get(tokenType).clear();
      });

      paintTokenHighlights(codeBlock, tokens);
    } catch (error) {
      console.warn("Error during highlighting:", error);
    }
  };

  /**
   * Handler for tab key in editors
   * @param {KeyboardEvent} e - The keyboard event
   */
  const handleTabKey = (e) => {
    if (e.keyCode === 9) {
      document.execCommand("insertHTML", false, "&#009");
      e.preventDefault();
    }
  };

  // Get editor elements
  const html = document.querySelector("#html");
  const css = document.querySelector("#css");
  const js = document.querySelector("#js");

  // Get hidden textarea elements
  const hiddenHtml = document.querySelector("[name=html]");
  const hiddenCss = document.querySelector("[name=css]");
  const hiddenJavascript = document.querySelector("[name=javascript]");

  // Set up content editable mode
  const contentEditableValue = "plaintext-only";
  [html, css, js].forEach((editor) => {
    editor.setAttribute("contenteditable", contentEditableValue);
  });

  // Fallback for Firefox which doesn't support plaintext-only
  if (html.contentEditable !== contentEditableValue) {
    [html, css, js].forEach((editor) => {
      editor.setAttribute("contenteditable", "true");
    });
  }

  // Set up event listeners for HTML editor
  html.addEventListener("keyup", (e) => {
    hiddenHtml.value = e.currentTarget.innerText;
  });

  html.addEventListener("keydown", (e) => {
    handleTabKey(e);
    requestAnimationFrame(() => {
      highlight(html, Prism.languages.html);
    });
  });

  // Set up event listeners for CSS editor
  css.addEventListener("keyup", (e) => {
    hiddenCss.value = e.currentTarget.innerText;
  });

  css.addEventListener("keydown", (e) => {
    handleTabKey(e);
    requestAnimationFrame(() => {
      highlight(css, Prism.languages.css);
    });
  });

  // Set up event listeners for JS editor
  js.addEventListener("keyup", (e) => {
    hiddenJavascript.value = e.currentTarget.innerText;
  });

  js.addEventListener("keydown", (e) => {
    handleTabKey(e);
    requestAnimationFrame(() => {
      highlight(js, Prism.languages.javascript);
    });
  });

  /**
   * Default content is imported from defaults.js module
   */

  /**
   * Loads cached content into editors
   * @returns {Promise<void>}
   */
  async function loadCachedContent() {
    try {
      const cache = await caches.open("asset-cache");

      // Safely get cached content
      let htmlContent = DEFAULTS.html;
      let cssContent = DEFAULTS.css;
      let jsContent = DEFAULTS.javascript;

      try {
        const markup = await cache.match("/preview/markup.html");
        if (markup) {
          htmlContent = await markup.text();
        }
      } catch (e) {
        console.warn("Could not load cached HTML, using default");
      }

      try {
        const css = await cache.match("/preview/styles.css");
        if (css) {
          cssContent = await css.text();
        }
      } catch (e) {
        console.warn("Could not load cached CSS, using default");
      }

      try {
        const javascript = await cache.match("/preview/script.js");
        if (javascript) {
          jsContent = await javascript.text();
        }
      } catch (e) {
        console.warn("Could not load cached JavaScript, using default");
      }

      // Update all editors safely
      const editors = [
        {
          element: html,
          content: htmlContent,
          hidden: hiddenHtml,
          lang: Prism.languages.html,
        },
        {
          element: css,
          content: cssContent,
          hidden: hiddenCss,
          lang: Prism.languages.css,
        },
        {
          element: js,
          content: jsContent,
          hidden: hiddenJavascript,
          lang: Prism.languages.javascript,
        },
      ];

      editors.forEach(({ element, content, hidden, lang }) => {
        try {
          // Update content
          element.innerText = content;
          hidden.value = content;

          // Apply highlighting with a delay to avoid race conditions
          if (content) {
            setTimeout(() => {
              highlight(element, lang);
            }, 0);
          }
        } catch (err) {
          console.warn(`Error updating editor: ${err.message}`);
        }
      });
    } catch (error) {
      console.error("Error loading cached content:", error);
      // The defaultContent will already be used due to the try/catch blocks above
    }
  }

  // Initial highlighting
  highlight(html, Prism.languages.html);
  highlight(css, Prism.languages.css);
  highlight(js, Prism.languages.javascript);

  // Load cached content
  loadCachedContent();

  // Add keyboard shortcut for saving (Cmd+S or Ctrl+S)
  document.addEventListener("keydown", (event) => {
    // Check for Cmd+S (Mac) or Ctrl+S (Windows)
    if ((event.metaKey || event.ctrlKey) && event.key === "s") {
      event.preventDefault(); // Prevent the browser's save dialog

      // Submit the form
      document.forms[0].requestSubmit();
    }
  });
}
