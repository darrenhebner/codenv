import "https://unpkg.com/prismjs@1.30.0";
import * as prettier from "https://unpkg.com/prettier@3.5.3/standalone.mjs";
import * as prettierPluginHtml from "https://unpkg.com/prettier@3.5.3/plugins/html.mjs";

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
    if (element.firstChild) {
      element.normalize();
    }
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

    let pos = 0;
    for (const token of tokens) {
      if (token.type) {
        const range = new Range();
        range.setStart(codeBlock.firstChild, pos);
        range.setEnd(codeBlock.firstChild, pos + token.length);
        CSS.highlights.get(token.alias ?? token.type)?.add(range);
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
    if (!codeBlock.innerText) {
      return;
    }

    if (codeBlock.firstChild) {
      flattenTextNodes(codeBlock);
    }

    if (!codeBlock.firstChild) {
      codeBlock.appendChild(document.createTextNode(codeBlock.innerText));
    }

    const tokens = Prism.tokenize(codeBlock.innerText, lang);

    // Clear all current highlights
    tokenTypes.forEach((tokenType) => {
      CSS.highlights.get(tokenType).clear();
    });

    paintTokenHighlights(codeBlock, tokens);
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
   * Loads cached content into editors
   * @returns {Promise<void>}
   */
  async function loadCachedContent() {
    try {
      const cache = await caches.open("asset-cache");

      // Get cached content
      const markup = await cache.match("/preview/markup.html");
      const css = await cache.match("/preview/styles.css");
      const javascript = await cache.match("/preview/script.js");

      // If we have cached content, load it into the editors
      if (markup && css && javascript) {
        const htmlContent = await markup.text();
        const cssContent = await css.text();
        const jsContent = await javascript.text();

        // Update all editors
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
          // Update content
          element.innerText = content;
          hidden.value = content;

          // Ensure element has a text node
          if (content && !element.firstChild) {
            element.appendChild(document.createTextNode(content));
          }

          // Apply highlighting
          if (content) {
            highlight(element, lang);
          }
        });
      }
    } catch (error) {
      console.error("Error loading cached content:", error);
    }
  }

  // Initial highlighting
  highlight(html, Prism.languages.html);
  highlight(css, Prism.languages.css);
  highlight(js, Prism.languages.javascript);

  // Load cached content
  loadCachedContent();
}

// Handle form submission
document.forms[0].addEventListener("submit", async (event) => {
  const formatted = await prettier.format(
    event.currentTarget.elements.html.value,
    {
      parser: "html",
      plugins: [prettierPluginHtml],
    }
  );

  // The formatted HTML will be handled by the service worker
  // Logging removed since it was just for debugging
});
