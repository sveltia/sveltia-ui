import { CodeHighlightNode, CodeNode, $createCodeNode as createCodeNode } from '@lexical/code-core';
import { HorizontalRuleNode } from '@lexical/extension';
import { $generateHtmlFromNodes as generateHtmlFromNodes } from '@lexical/html';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode } from '@lexical/table';
import {
  $createTextNode as createTextNode,
  $isParagraphNode as isParagraphNode,
  isHTMLElement,
  ParagraphNode,
  TabNode,
  TextNode,
} from 'lexical';
import { isPlainLanguage } from './shiki/facade.js';

/**
 * @import {
 * DOMConversion,
 * DOMConversionMap,
 * DOMConversionOutput,
 * DOMExportOutput,
 * DOMExportOutputMap,
 * ElementNode,
 * LexicalEditor,
 * LexicalNode,
 * } from 'lexical';
 */

/**
 * Attributes to be kept on the exported elements, by tag name. Anything else Lexical adds, like
 * `class`, `dir`, `style`, `value` or `spellcheck`, is only meant for the editor itself.
 * @type {Record<string, string[]>}
 */
const ALLOWED_ATTRIBUTES = {
  a: ['href', 'rel', 'target', 'title'],
  ol: ['start'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan'],
};

/**
 * Text formats and their HTML tags, from the innermost to the outermost.
 * @type {[import('lexical').TextFormatType, string][]}
 */
const TEXT_FORMAT_TAGS = [
  ['code', 'code'],
  ['subscript', 'sub'],
  ['superscript', 'sup'],
  ['highlight', 'mark'],
  ['underline', 'u'],
  ['strikethrough', 's'],
  ['italic', 'em'],
  ['bold', 'strong'],
];

/**
 * Table elements that have no Lexical node of their own. The rows are imported as is, while the
 * column definitions are only used for the column widths.
 */
const PASSTHROUGH_TAGS = ['tbody', 'thead', 'tfoot', 'colgroup', 'col'];
/**
 * Elements the HTML parser always creates, which hold the content rather than being part of it.
 */
const DOCUMENT_TAGS = ['html', 'head', 'body'];

/**
 * Get the programming language from the `language-*` or `lang-*` class of the given `<code>`
 * element, which is common in HTML generated from Markdown.
 * @param {Element} code `<code>` element.
 * @returns {string | undefined} Language.
 */
export const getCodeLanguage = (code) =>
  code.className.match(/(?:^|\s)(?:lang|language)-(\S+)/)?.[1];

/**
 * Remove the attributes not listed in {@link ALLOWED_ATTRIBUTES} from the given element.
 * @param {Element} element Element.
 */
const removeExtraAttributes = (element) => {
  const allowedAttributes = ALLOWED_ATTRIBUTES[element.localName] ?? [];

  [...element.attributes].forEach(({ name }) => {
    if (!allowedAttributes.includes(name)) {
      element.removeAttribute(name);
    }
  });
};

/**
 * Export an element node with Lexical’s own implementation, then remove the extra attributes from
 * the element, as well as the attribute Lexical adds to the `<br>` terminating a trailing line
 * break. The element’s own `after` function, if any, still runs first, so the structure is kept,
 * like a nested list moved into the previous list item.
 * @param {LexicalEditor} editor Editor instance.
 * @param {ElementNode} node Element node.
 * @returns {DOMExportOutput} Export output.
 */
const exportElementNode = (editor, node) => {
  const { after, ...output } = node.exportDOM(editor);

  if (isHTMLElement(output.element)) {
    removeExtraAttributes(output.element);
  }

  return {
    ...output,
    /**
     * Clean up the element once its children are in place.
     * @param {HTMLElement | DocumentFragment | Text | null | undefined} element Exported element.
     * @returns {HTMLElement | DocumentFragment | Text | null | undefined} New element to replace
     * the exported one, if any.
     */
    after: (element) => {
      const newElement = after ? after.call(node, element) : undefined;
      const target = newElement ?? element;

      if (isHTMLElement(target)) {
        removeExtraAttributes(target);
        target.querySelectorAll(':scope > br').forEach(removeExtraAttributes);
      }

      // Returning the same element would make Lexical replace it with itself
      return newElement === element ? undefined : newElement;
    },
  };
};

/**
 * Export a paragraph node. Empty paragraphs at the end are left out, as they have no content; one
 * may be added just by clicking below a block decorator. A paragraph that is the only child of a
 * table cell is exported without the `<p>` element.
 * @param {LexicalEditor} editor Editor instance.
 * @param {ParagraphNode} node Paragraph node.
 * @returns {DOMExportOutput} Export output.
 */
const exportParagraphNode = (editor, node) => {
  const parent = node.getParent();

  if (parent instanceof TableCellNode && parent.getChildrenSize() === 1) {
    return { element: document.createDocumentFragment() };
  }

  if (
    node.isEmpty() &&
    node.getNextSiblings().every((sibling) => isParagraphNode(sibling) && sibling.isEmpty())
  ) {
    return { element: null };
  }

  return exportElementNode(editor, node);
};

/**
 * Export a text node as plain text wrapped with the elements for its formats, instead of the
 * `<span>`, `<b>` and `<i>` elements with styles and classes Lexical uses.
 * @param {LexicalEditor} _editor Editor instance.
 * @param {TextNode} node Text node.
 * @returns {DOMExportOutput} Export output.
 */
const exportTextNode = (_editor, node) => {
  /** @type {HTMLElement | Text} */
  let element = document.createTextNode(node.getTextContent());

  TEXT_FORMAT_TAGS.forEach(([format, tagName]) => {
    if (node.hasFormat(format)) {
      const wrapper = document.createElement(tagName);

      wrapper.append(element);
      element = wrapper;
    }
  });

  return { element };
};

/**
 * Export a code block node as `<pre><code>` with the common `language-*` class, instead of the
 * highlighted tokens Lexical renders in the editor. The children are still exported as usual, so
 * copying part of a code block only exports the selected text, then their text is moved into the
 * `<code>` element.
 * @param {LexicalEditor} _editor Editor instance.
 * @param {CodeNode} node Code node.
 * @returns {DOMExportOutput} Export output.
 */
const exportCodeNode = (_editor, node) => ({
  element: document.createElement('pre'),
  /**
   * Replace the exported children with a `<code>` element holding their text.
   * @param {HTMLElement | DocumentFragment | Text | null | undefined} pre Exported element.
   * @returns {undefined} Nothing, as the element is updated in place.
   */
  after: (pre) => {
    /* v8 ignore next 3 */
    if (!isHTMLElement(pre)) {
      return undefined;
    }

    const code = document.createElement('code');
    const language = node.getLanguage();

    if (language && !isPlainLanguage(language)) {
      code.className = `language-${language}`;
    }

    code.textContent = [...pre.childNodes]
      .map((child) => {
        if (child.nodeName !== 'BR') {
          return child.textContent;
        }

        // Skip the `<br>` Lexical adds to terminate a trailing line break
        return isHTMLElement(child) && child.hasAttribute('data-lexical-managed-linebreak')
          ? ''
          : '\n';
      })
      .join('');

    pre.replaceChildren(code);

    return undefined;
  },
});

/**
 * Selector for the structural elements of a table, excluding the cell content.
 */
const TABLE_STRUCTURE_SELECTOR = [
  ':scope > :is(thead, tbody, tfoot)',
  ':scope > :is(thead, tbody, tfoot) > tr',
  ':scope > :is(thead, tbody, tfoot) > tr > :is(th, td)',
  ':scope > tr',
  ':scope > tr > :is(th, td)',
].join(', ');

/**
 * Export a table node, then remove the column definitions and extra attributes Lexical adds to the
 * table and its descendants. The cleanup has to wait until the table is complete, as Lexical uses
 * temporary attributes on the cells to compute the columns.
 * @param {LexicalEditor} editor Editor instance.
 * @param {TableNode} node Table node.
 * @returns {DOMExportOutput} Export output.
 */
const exportTableNode = (editor, node) => {
  const { after, ...output } = node.exportDOM(editor);

  return {
    ...output,
    /**
     * Clean up the table once Lexical has completed it.
     * @param {HTMLElement | DocumentFragment | Text | null | undefined} element Exported element.
     * @returns {HTMLElement | DocumentFragment | Text | null | undefined} New element to replace
     * the exported one, if any.
     */
    after: (element) => {
      const newElement = after ? after.call(node, element) : undefined;
      const target = newElement ?? element;

      if (isHTMLElement(target)) {
        target.querySelectorAll(':scope > colgroup').forEach((colgroup) => colgroup.remove());
        // Leave the cell content alone, which has been cleaned up by its own nodes, while the
        // content of an editor component may need its attributes
        [target, ...target.querySelectorAll(TABLE_STRUCTURE_SELECTOR)].forEach(
          removeExtraAttributes,
        );
      }

      // Returning the same element would make Lexical replace it with itself
      return newElement === element ? undefined : newElement;
    },
  };
};

/**
 * Map of Lexical node classes and functions to export them to clean HTML. A class only takes effect
 * if the node is registered with the editor. Other nodes, including the ones of editor components,
 * are exported with their own `exportDOM` method.
 * @type {DOMExportOutputMap}
 */
export const HTML_EXPORT_MAP = new Map(
  /** @type {[any, (editor: LexicalEditor, node: any) => DOMExportOutput][]} */ ([
    [TextNode, exportTextNode],
    [TabNode, exportTextNode],
    [CodeHighlightNode, exportTextNode],
    [ParagraphNode, exportParagraphNode],
    [HeadingNode, exportElementNode],
    [QuoteNode, exportElementNode],
    [ListNode, exportElementNode],
    [ListItemNode, exportElementNode],
    [LinkNode, exportElementNode],
    [HorizontalRuleNode, exportElementNode],
    [CodeNode, exportCodeNode],
    [TableNode, exportTableNode],
  ]),
);

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
 * Additional DOM conversions to import HTML. They take priority over Lexical’s own conversions.
 * @type {DOMConversionMap}
 */
export const HTML_IMPORT_MAP = {
  /**
   * Get the conversion for a `<pre>` element.
   * @returns {DOMConversion} Conversion.
   */
  pre: () => ({ conversion: convertPreElement, priority: 2 }),
};

/**
 * Get the first node in the given document that the editor cannot import, which would be silently
 * dropped, possibly along with its content:
 *
 * - An element none of the registered nodes, including the ones of editor components, handle. This
 * includes an element the parser moves to `<head>`, like a `<script>` at the beginning.
 * - A comment, like `<!-- more -->`.
 *
 * The elements within a `<pre>` element are ignored, as its content is imported as plain text.
 * @param {LexicalEditor} editor Editor instance.
 * @param {Document} dom Parsed document.
 * @returns {Element | Comment | undefined} Unsupported node.
 */
export const findUnsupportedNode = (editor, dom) => {
  const walker = dom.createTreeWalker(dom, NodeFilter.SHOW_ALL);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.COMMENT_NODE) {
      return /** @type {Comment} */ (node);
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = /** @type {Element} */ (node);
      const tagName = element.localName;

      // `_htmlConversions` holds the conversions of all the registered nodes, along with the ones
      // in the `html.import` editor config. A conversion may still skip an element on purpose,
      // like a `<br>` at the end of a paragraph, which browsers don’t render
      if (
        !DOCUMENT_TAGS.includes(tagName) &&
        !PASSTHROUGH_TAGS.includes(tagName) &&
        !element.parentElement?.closest('pre') &&
        !editor._htmlConversions.has(tagName)
      ) {
        return element;
      }
    }
  }

  return undefined;
};

/**
 * Convert the editor content to HTML. Call this within an editor update or read.
 * @param {LexicalEditor} editor Editor instance.
 * @returns {string} HTML value.
 */
export const exportHtml = (editor) => generateHtmlFromNodes(editor);
