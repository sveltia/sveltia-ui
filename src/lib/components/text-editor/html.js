import { CodeHighlightNode, CodeNode, $createCodeNode as createCodeNode } from '@lexical/code-core';
import { HorizontalRuleNode } from '@lexical/extension';
import { $generateHtmlFromNodes as generateHtmlFromNodes } from '@lexical/html';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode } from '@lexical/table';
import {
  $createTextNode as createTextNode,
  $getEditor as getEditor,
  $isParagraphNode as isParagraphNode,
  isDOMTextNode,
  isHTMLElement,
  isInlineDomNode,
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
 * @import { TextEditorComponent } from '../../typedefs.js';
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
 * Editor components of each editor, used to tell the elements they import, which come with their
 * content, when HTML is imported.
 * @type {WeakMap<LexicalEditor, TextEditorComponent[]>}
 */
export const editorComponents = new WeakMap();

/**
 * Conversion maps of the editor component nodes, cached as each `importDOM()` call can create a new
 * map.
 * @type {WeakMap<any, DOMConversionMap>}
 */
const componentConversionMaps = new WeakMap();

/**
 * Get the conversion map of the given editor component node.
 * @param {any} node Lexical node class.
 * @returns {DOMConversionMap} Conversion map.
 */
const getComponentConversionMap = (node) => {
  let map = componentConversionMaps.get(node);

  if (!map) {
    map = node.importDOM?.() ?? {};
    componentConversionMaps.set(node, /** @type {DOMConversionMap} */ (map));
  }

  return /** @type {DOMConversionMap} */ (map);
};

/**
 * Editor component that imports each element, or `null` if none does, cached as the same element is
 * checked many times during an import, and a conversion can run developer code. An element is only
 * imported to one editor, as each import parses the HTML anew.
 * @type {WeakMap<Element, TextEditorComponent | null>}
 */
const elementComponents = new WeakMap();

/**
 * Get the editor component that imports the given element, if any. The element’s content is then
 * part of the component.
 * @param {LexicalEditor} editor Editor instance.
 * @param {Element} element Element.
 * @returns {TextEditorComponent | undefined} Component.
 */
const getElementComponent = (editor, element) => {
  let component = elementComponents.get(element);

  if (component === undefined) {
    component =
      editorComponents
        .get(editor)
        ?.find(
          ({ node }) =>
            !!getComponentConversionMap(node)[element.localName]?.(
              /** @type {HTMLElement} */ (element),
            ),
        ) ?? null;
    elementComponents.set(element, component);
  }

  return component ?? undefined;
};

/**
 * Check if the given element is imported by an inline editor component, like an image, which is
 * content in the line just like text.
 * @param {Element} element Element.
 * @returns {boolean} Result.
 */
const isInlineComponentElement = (element) => {
  const component = getElementComponent(getEditor(), element);

  // The `node` is actually a node class
  return !!component && !!(/** @type {any} */ (component.node).prototype.isInline?.());
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
 * Check if the given node is within a `<pre>` element or an element with preformatted whitespace,
 * whose text is imported by Lexical’s own conversion as is.
 * @param {Node} node Node.
 * @returns {boolean} Result.
 */
const isPreformatted = (node) => {
  for (let element = node.parentElement; element; element = element.parentElement) {
    if (element.localName === 'pre' || element.style.whiteSpace.startsWith('pre')) {
      return true;
    }
  }

  return false;
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

/**
 * Get the names of the elements only editor components import, which no other node handles.
 * @param {LexicalEditor} editor Editor instance.
 * @returns {Set<string>} Tag names.
 */
const getComponentOnlyTagNames = (editor) => {
  const components = editorComponents.get(editor) ?? [];
  // The `node` is actually a node class
  const componentNodes = new Set(components.map(({ node }) => /** @type {any} */ (node)));

  const otherTagNames = new Set(
    [...editor._nodes.values()]
      .filter(({ klass }) => !componentNodes.has(klass))
      .flatMap(({ klass }) => Object.keys(klass.importDOM?.() ?? {})),
  );

  return new Set(
    components
      .flatMap(({ node }) => Object.keys(getComponentConversionMap(node)))
      .filter((tagName) => !otherTagNames.has(tagName)),
  );
};

/**
 * Get the first node in the given document that the editor cannot import, which would be silently
 * dropped, possibly along with its content:
 *
 * - An element none of the registered nodes, including the ones of editor components, handle. This
 * includes an element the parser moves to `<head>`, like a `<script>` at the beginning, and an
 * element only editor components handle, but none of them imports, like a `<figure>` that isn’t an
 * instance of a component for `<figure class="photo">`, which would be unwrapped.
 * - A comment, like `<!-- more -->`.
 *
 * The content of an element an editor component imports is part of the component, which is
 * expected to drop the children, and the elements within a `<pre>` element are imported as plain
 * text, so they’re ignored.
 * @param {LexicalEditor} editor Editor instance.
 * @param {Document} dom Parsed document.
 * @returns {Element | Comment | undefined} Unsupported node.
 */
export const findUnsupportedNode = (editor, dom) => {
  const componentOnlyTagNames = getComponentOnlyTagNames(editor);

  /**
   * Find an unsupported node among the descendants of the given node.
   * @param {Node} parent Parent node.
   * @returns {Element | Comment | undefined} Unsupported node.
   */
  const findWithin = (parent) => {
    /** @type {Element | Comment | undefined} */
    let found;

    [...parent.childNodes].some((node) => {
      if (node.nodeType === Node.COMMENT_NODE) {
        found = /** @type {Comment} */ (node);

        return true;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return false;
      }

      const element = /** @type {Element} */ (node);
      const tagName = element.localName;

      if (getElementComponent(editor, element)) {
        return false;
      }

      // `_htmlConversions` holds the conversions of all the registered nodes, along with the ones
      // in the `html.import` editor config. A conversion may still skip an element on purpose,
      // like a `<br>` at the end of a paragraph, which browsers don’t render
      if (
        !DOCUMENT_TAGS.includes(tagName) &&
        !PASSTHROUGH_TAGS.includes(tagName) &&
        (!editor._htmlConversions.has(tagName) || componentOnlyTagNames.has(tagName))
      ) {
        found = element;

        return true;
      }

      found =
        tagName === 'pre'
          ? /** @type {Comment | undefined} */ (
              dom.createTreeWalker(element, NodeFilter.SHOW_COMMENT).nextNode() ?? undefined
            )
          : findWithin(element);

      return !!found;
    });

    return found;
  };

  return findWithin(dom);
};

/**
 * Convert the editor content to HTML. Call this within an editor update or read.
 * @param {LexicalEditor} editor Editor instance.
 * @returns {string} HTML value.
 */
export const exportHtml = (editor) => generateHtmlFromNodes(editor);
