import "https://unpkg.com/prismjs@1.30.0";
import * as prettier from "https://unpkg.com/prettier@3.5.3/standalone.mjs";
import * as prettierPluginHtml from "https://unpkg.com/prettier@3.5.3/plugins/html.mjs";

if (CSS.highlights) {
  // Register all token types
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
    "string",
    "atrule",
    "attr",
    "keyword",
    "function",
    "class",
    "regex",
    "important",
    "variable",
    "important",
    "bold",
    "italic",
    "entity",
    "parameter",
    "class-name",
  ];

  tokenTypes.forEach((tokenType) => {
    CSS.highlights.set(tokenType, new Highlight());
  });

  // Helper function to get the carent position inside an element
  // Plays nice with an element having multiple text nodes as its children
  const getCaretPosition = (el) => {
    const selectionInfo = window.getSelection(el);
    let node = selectionInfo.anchorNode;
    let pos = selectionInfo.anchorOffset;

    // Need to loop all previous siblings here becase you only get the position
    // in the current text node, so we need to offset the previousSibling here
    // TODO: This might need a rewrite to make sure it only loops textNodes
    while (node.previousSibling) {
      pos += node.previousSibling.length;
      node = node.previousSibling;
    }

    return pos;
  };

  // Helper function to flatten the text nodes in an element to
  // only 1
  const flattenTextNodes = (codeBlock) => codeBlock.normalize();
  /*
	const flattenTextNodes = (codeBlock) => {	
		if (codeBlock.childNodes.length > 1) {
			// Record current caret position
			const caretPosition = getCaretPosition(codeBlock);

			// Set firstChild to hold the whole text
			codeBlock.firstChild.textContent = codeBlock.firstChild.wholeText;			

			// Remove all other text nodes
			let node = codeBlock.firstChild;
			while (node.nextSibling) {
				codeBlock.removeChild(node.nextSibling);
			}

			// Restore caret position
			// @TODO: There is 1 little bug: when selecting the entire last line and hitting
			// backspace, you end up at position 0;
			window.getSelection(codeBlock).setPosition(codeBlock.firstChild, caretPosition);
		}
	}
	*/

  // Loops all tokens and highlights them based on their type
  const paintTokenHighlights = (codeBlock, tokens) => {
    // Paint new highlights
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

  const highlight = (codeBlock, lang = Prism.languages.javascript) => {
    // We need the contenteditable to hold only 1 child textNode that
    // contains all the text. If we don’t do this, the highlight ranges
    // might go out of bounds.
    flattenTextNodes(codeBlock);

    // Tokenize the code
    let tokens = Prism.tokenize(codeBlock.innerText, lang);

    // Clear all current highlights
    tokenTypes.forEach((tokenType) => {
      CSS.highlights.get(tokenType).clear();
    });

    // Paint all token highlights
    paintTokenHighlights(codeBlock, tokens);
  };

  const html = document.querySelector("#html");
  const css = document.querySelector("#css");
  const js = document.querySelector("#js");

  // Allow only plaintext editing
  // Firefox doesn’t do 'plaintext-only', but does do 'true'
  html.setAttribute("contenteditable", "plaintext-only");
  css.setAttribute("contenteditable", "plaintext-only");
  js.setAttribute("contenteditable", "plaintext-only");

  if (html.contentEditable != "plaintext-only") {
    html.setAttribute("contenteditable", "true");
    css.setAttribute("contenteditable", "true");
    js.setAttribute("contenteditable", "true");
  }

  highlight(html, Prism.languages.html);
  highlight(css, Prism.languages.css);
  highlight(js, Prism.languages.javascript);

  // Prevent content-editable from doing nasty stuff when hitting enter/tab

  const hiddenHtml = document.querySelector("[name=html]");
  html.addEventListener("keyup", (e) => {
    hiddenHtml.value = e.currentTarget.innerText;
  });

  const hiddenCss = document.querySelector("[name=css]");
  css.addEventListener("keyup", (e) => {
    hiddenCss.value = e.currentTarget.innerText;
  });

  const hiddenJavascript = document.querySelector("[name=javascript]");
  js.addEventListener("keyup", (e) => {
    hiddenJavascript.value = e.currentTarget.innerText;
  });

  html.addEventListener("keydown", (e) => {
    // // Enter
    // if (e.key === 'Enter') {
    // 	document.execCommand('insertLineBreak')
    // 	e.preventDefault();
    // }

    // The tab key should insert a tab character
    if (e.keyCode == 9) {
      document.execCommand("insertHTML", false, "&#009");
      e.preventDefault();
    }

    requestAnimationFrame(() => {
      highlight(html, Prism.languages.html);
    });
  });

  css.addEventListener("keydown", (e) => {
    // // Enter
    // if (e.key === 'Enter') {
    // 	document.execCommand('insertLineBreak')
    // 	e.preventDefault();
    // }

    // The tab key should insert a tab character
    if (e.keyCode == 9) {
      document.execCommand("insertHTML", false, "&#009");
      e.preventDefault();
    }

    requestAnimationFrame(() => {
      highlight(css, Prism.languages.html);
    });
  });

  js.addEventListener("keydown", (e) => {
    // // Enter
    // if (e.key === 'Enter') {
    // 	document.execCommand('insertLineBreak')
    // 	e.preventDefault();
    // }

    // The tab key should insert a tab character
    if (e.keyCode == 9) {
      document.execCommand("insertHTML", false, "&#009");
      e.preventDefault();
    }

    requestAnimationFrame(() => {
      highlight(js, Prism.languages.javascript);
    });
  });
}

document.forms[0].addEventListener("submit", async (event) => {
  const formatted = await prettier.format(
    event.currentTarget.elements.html.value,
    {
      parser: "html",
      plugins: [prettierPluginHtml],
    }
  );

  console.log(formatted);
  // need to set preview with this value
});
