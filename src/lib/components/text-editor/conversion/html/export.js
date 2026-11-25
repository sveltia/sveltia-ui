/**
 * Export of the editor content to clean HTML, without the attributes and elements only meant for
 * the editor.
 */

import { CodeHighlightNode, CodeNode } from '@lexical/code-core';
import { HorizontalRuleNode } from '@lexical/extension';
import { $generateHtmlFromNodes as generateHtmlFromNodes } from '@lexical/html';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode } from '@lexical/table';
import {
  $isParagraphNode as isParagraphNode,
  isHTMLElement,
  ParagraphNode,
  TabNode,
  TextNode,
} from 'lexical';
import { isPlainLanguage } from '../../shiki/engine.js';
import { decorateTaskList, decorateTaskListItem } from './task-list.js';
import { splitParagraphAroundBlocks } from './paragraph.js';
import { TEXT_FORMAT_TAGS } from './utils.js';

/**
 * @import {
 * DOMExportOutput,
 * DOMExportOutputMap,
 * ElementNode,
 * LexicalEditor,
 * } from 'lexical';
 */

/**
 * Attributes to be kept on the exported elements, by tag name. Anything else Lexical adds, like
 * `class`, `dir`, `style`, `value` or `spellcheck`, is only meant for the editor itself, except for
 * the text alignment of a block; see {@link ALIGNABLE_TAGS}.
 * @type {Record<string, string[]>}
 */
const ALLOWED_ATTRIBUTES = {
  a: ['href', 'rel', 'target', 'title'],
  ol: ['start'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan'],
};

/**
 * Elements that keep their text alignment, which is the only style kept in the exported HTML.
 * Lexical writes it as `style="text-align: …"` for the blocks it can be set on.
 */
const ALIGNABLE_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'li'];

/**
 * Remove the attributes not listed in {@link ALLOWED_ATTRIBUTES} from the given element, as well as
 * any style but the text alignment of a block listed in {@link ALIGNABLE_TAGS}.
 * @param {Element} element Element.
 */
const removeExtraAttributes = (element) => {
  const allowedAttributes = ALLOWED_ATTRIBUTES[element.localName] ?? [];

  const textAlign = ALIGNABLE_TAGS.includes(element.localName)
    ? /** @type {HTMLElement} */ (element).style.textAlign
    : '';

  [...element.attributes].forEach(({ name }) => {
    if (!allowedAttributes.includes(name)) {
      element.removeAttribute(name);
    }
  });

  if (textAlign) {
    /** @type {HTMLElement} */ (element).style.textAlign = textAlign;
  }
};

/**
 * Wrap the `after` function of an export output, so the given function can update the exported
 * element once the original function, if any, has run. The function gets the element returned by
 * the original function, or the exported element if none.
 * @param {DOMExportOutput['after']} after Original function, if any.
 * @param {ElementNode} node Exported node, used as `this` for the original function.
 * @param {(element: HTMLElement) => DocumentFragment | undefined | void} update Function to update
 * the element. It can return a new element to replace it with.
 * @returns {NonNullable<DOMExportOutput['after']>} Wrapped function, which returns the new element
 * to replace the exported one, if any.
 */
const wrapExportAfter = (after, node, update) => (element) => {
  const newElement = after ? after.call(node, element) : undefined;
  const target = newElement ?? element;
  const replacement = isHTMLElement(target) ? update(target) : undefined;

  if (replacement) {
    return replacement;
  }

  // Returning the same element would make Lexical replace it with itself
  return newElement === element ? undefined : newElement;
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
    // Clean up the element once its children are in place
    after: wrapExportAfter(after, node, (element) => {
      removeExtraAttributes(element);
      element.querySelectorAll(':scope > br').forEach(removeExtraAttributes);
    }),
  };
};

/**
 * Export a paragraph node. Empty paragraphs at the end are left out, as they have no content; one
 * may be added just by clicking below a block decorator. A paragraph that is the only child of a
 * table cell is exported without the `<p>` element, unless it’s aligned. A paragraph holding
 * elements it can’t hold, like a `<figure>`, is split around them.
 * @param {LexicalEditor} editor Editor instance.
 * @param {ParagraphNode} node Paragraph node.
 * @returns {DOMExportOutput} Export output.
 */
const exportParagraphNode = (editor, node) => {
  const parent = node.getParent();

  // Keep the `<p>` of an aligned paragraph, which holds the alignment
  if (parent instanceof TableCellNode && parent.getChildrenSize() === 1 && !node.getFormatType()) {
    return { element: document.createDocumentFragment() };
  }

  if (
    node.isEmpty() &&
    node.getNextSiblings().every((sibling) => isParagraphNode(sibling) && sibling.isEmpty())
  ) {
    return { element: null };
  }

  const { after, ...output } = exportElementNode(editor, node);

  // Clean up the paragraph once its children are in place, and split it around the elements it
  // can’t hold, if any
  return { ...output, after: wrapExportAfter(after, node, splitParagraphAroundBlocks) };
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
    // Clean up the table once Lexical has completed it
    after: wrapExportAfter(after, node, (element) => {
      element.querySelectorAll(':scope > colgroup').forEach((colgroup) => colgroup.remove());
      // Leave the cell content alone, which has been cleaned up by its own nodes, while the content
      // of an editor component may need its attributes
      [element, ...element.querySelectorAll(TABLE_STRUCTURE_SELECTOR)].forEach(
        removeExtraAttributes,
      );
    }),
  };
};

/**
 * Export an element node with {@link exportElementNode}, then update the cleaned-up element with
 * the given function, like adding the classes and check boxes of a task list.
 * @param {LexicalEditor} editor Editor instance.
 * @param {ElementNode} node Element node.
 * @param {(element: HTMLElement) => void} decorate Function to update the exported element.
 * @returns {DOMExportOutput} Export output.
 */
const exportDecoratedElementNode = (editor, node, decorate) => {
  const { after, ...output } = exportElementNode(editor, node);

  // Update the element once it’s been cleaned up
  return { ...output, after: wrapExportAfter(after, node, decorate) };
};

/**
 * Export a list node, adding the class of a task list to a check list.
 * @param {LexicalEditor} editor Editor instance.
 * @param {ListNode} node List node.
 * @returns {DOMExportOutput} Export output.
 */
const exportListNode = (editor, node) =>
  exportDecoratedElementNode(editor, node, (element) => decorateTaskList(node, element));

/**
 * Export a list item node, adding the class and a disabled check box to an item of a check list.
 * @param {LexicalEditor} editor Editor instance.
 * @param {ListItemNode} node List item node.
 * @returns {DOMExportOutput} Export output.
 */
const exportListItemNode = (editor, node) =>
  exportDecoratedElementNode(editor, node, (element) => decorateTaskListItem(node, element));

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
    [ListNode, exportListNode],
    [ListItemNode, exportListItemNode],
    [LinkNode, exportElementNode],
    [HorizontalRuleNode, exportElementNode],
    [CodeNode, exportCodeNode],
    [TableNode, exportTableNode],
  ]),
);

/**
 * Convert the editor content to HTML. Call this within an editor update or read.
 * @param {LexicalEditor} editor Editor instance.
 * @returns {string} HTML value.
 */
export const exportHtml = (editor) => generateHtmlFromNodes(editor);
