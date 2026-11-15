/**
 * Detection of HTML the rich text editor can’t import, which can then only be edited as source.
 */

import { isTaskListCheckbox } from './task-list.js';
import { editorComponents, getComponentConversionMap, getElementComponent } from './components.js';

/**
 * @import { LexicalEditor } from 'lexical';
 */

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
        (!editor._htmlConversions.has(tagName) ||
          componentOnlyTagNames.has(tagName) ||
          // Only the check box of a task list item can be imported
          (tagName === 'input' && !isTaskListCheckbox(element)))
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
