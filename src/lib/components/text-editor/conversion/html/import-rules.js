/**
 * Rules to import HTML: DOM conversions that take priority over Lexical’s own.
 */

import { $createCodeNode as createCodeNode } from '@lexical/code-core';
import {
  $createTextNode as createTextNode,
  isDOMTextNode,
  isHTMLElement,
  isInlineDomNode,
} from 'lexical';
import { isInlineComponentElement } from './components.js';
import { isPreformatted } from './utils.js';

/**
 * @import {
 * DOMConversion,
 * DOMConversionMap,
 * DOMConversionOutput,
 * LexicalNode,
 * } from 'lexical';
 */

/**
 * Get the programming language from the `language-*` or `lang-*` class of the given `<code>`
 * element, which is common in HTML generated from Markdown.
 * @param {Element} code `<code>` element.
 * @returns {string | undefined} Language.
 */
export const getCodeLanguage = (code) =>
  code.className.match(/(?:^|\s)(?:lang|language)-(\S+)/)?.[1];

/**
 * Get the text content of the given element, with `<br>` elements as line breaks.
 * @param {Element} element Element.
 * @returns {string} Text.
 */
const getTextWithLineBreaks = (element) => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_ALL);
  let text = '';

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += /** @type {Text} */ (node).data;
    } else if (node.nodeName === 'BR') {
      text += '\n';
    }
  }

  return text;
};

/**
 * Convert a `<pre>` element to a code block node, taking the language from the `language-*` or
 * `lang-*` class of the `<code>` element within it, which is common in HTML generated from
 * Markdown, as well as the `data-language` attribute Lexical uses. The content is imported as plain
 * text, so any markup within it, like highlighted tokens, is dropped, while a `<br>` element
 * becomes a line break.
 * @param {HTMLElement} pre `<pre>` element.
 * @returns {DOMConversionOutput} Conversion output.
 */
const convertPreElement = (pre) => {
  const code = pre.querySelector(':scope > code');
  const language = (code ? getCodeLanguage(code) : undefined) ?? pre.getAttribute('data-language');
  const node = createCodeNode(language);
  // A code block generated from Markdown ends with a line break
  const text = getTextWithLineBreaks(pre).replace(/\n$/, '');

  if (text) {
    node.append(createTextNode(text));
  }

  return {
    node,
    /**
     * Drop the child nodes, which are already imported as the text content.
     * @returns {LexicalNode[]} Nodes.
     */
    after: () => [],
  };
};

/**
 * Find the text or the inline editor component element next to the given text in the same line,
 * like Lexical’s own `findTextInLine()` does for text only. Without the component, Lexical takes an
 * element like an image for the end of the line, or skips it, and drops the space between it and
 * the text, e.g. `a <img> b` becomes `a<img>b`.
 * @param {Node} text Text node.
 * @param {boolean} forward Whether to search forward.
 * @returns {Text | Element | null} Text or element, or `null` if the line ends.
 */
const findContentInLine = (text, forward) => {
  let node = text;

  for (;;) {
    let sibling = forward ? node.nextSibling : node.previousSibling;

    while (!sibling) {
      const { parentElement } = node;

      if (!parentElement) {
        return null;
      }

      node = parentElement;
      sibling = forward ? node.nextSibling : node.previousSibling;
    }

    node = sibling;

    if (isHTMLElement(node)) {
      if (isInlineComponentElement(node)) {
        return node;
      }

      const { display } = node.style;

      if (display ? !display.startsWith('inline') : !isInlineDomNode(node)) {
        return null;
      }
    }

    let descendant = forward ? node.firstChild : node.lastChild;

    while (descendant) {
      node = descendant;

      if (isHTMLElement(node) && isInlineComponentElement(node)) {
        return node;
      }

      descendant = forward ? node.firstChild : node.lastChild;
    }

    if (isDOMTextNode(node)) {
      return node;
    }

    if (node.nodeName === 'BR') {
      return null;
    }
  }
};

/**
 * Convert a text node, collapsing whitespace like Lexical’s own conversion does, except that an
 * inline editor component element counts as content. See {@link findContentInLine}.
 * @param {Text} domNode Text node.
 * @returns {DOMConversionOutput} Conversion output.
 */
const convertTextNode = (domNode) => {
  let textContent = domNode.data.replace(/\r/g, '').replace(/[ \t\n]+/g, ' ');

  if (textContent.startsWith(' ')) {
    let previous = findContentInLine(domNode, false);
    // Drop the space at the start of a line, or after another space
    let drop = true;

    for (; previous; previous = findContentInLine(previous, false)) {
      if (!isDOMTextNode(previous)) {
        drop = false;
        break;
      }

      const previousText = previous.data;

      // Skip empty text
      if (previousText) {
        drop = /[ \t\n]$/.test(previousText);
        break;
      }
    }

    if (drop) {
      textContent = textContent.slice(1);
    }
  }

  if (textContent.endsWith(' ')) {
    let next = findContentInLine(domNode, true);
    let isEndOfLine = true;

    // Skip any text that only has whitespace, which is dropped as well
    for (; next; next = findContentInLine(next, true)) {
      if (!isDOMTextNode(next) || next.data.replace(/^[ \t\n]+/, '')) {
        isEndOfLine = false;
        break;
      }
    }

    if (isEndOfLine) {
      textContent = textContent.slice(0, -1);
    }
  }

  return { node: textContent ? createTextNode(textContent) : null };
};

/**
 * Additional DOM conversions to import HTML. They take priority over Lexical’s own conversions.
 * @type {DOMConversionMap}
 */
export const HTML_IMPORT_MAP = {
  /**
   * Get the conversion for a text node, unless it’s preformatted, which Lexical’s own conversion
   * handles.
   * @param {Node} node Text node.
   * @returns {DOMConversion | null} Conversion.
   */
  '#text': (node) =>
    isPreformatted(node)
      ? null
      : {
          /**
           * Convert the text node.
           * @param {Node} domNode Text node.
           * @returns {DOMConversionOutput} Conversion output.
           */
          conversion: (domNode) => convertTextNode(/** @type {Text} */ (domNode)),
          priority: 1,
        },
};

/**
 * Additional DOM conversions to import HTML with code blocks.
 * @type {DOMConversionMap}
 */
export const HTML_CODE_IMPORT_MAP = {
  /**
   * Get the conversion for a `<pre>` element.
   * @returns {DOMConversion} Conversion.
   */
  pre: () => ({ conversion: convertPreElement, priority: 2 }),
};
