/**
 * Editor components in HTML: the elements they import, which come with their content.
 */

import { $getEditor as getEditor } from 'lexical';

/**
 * @import { DOMConversionMap, LexicalEditor } from 'lexical';
 * @import { TextEditorComponent } from '../../../../typedefs.js';
 */

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
export const getComponentConversionMap = (node) => {
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
export const getElementComponent = (editor, element) => {
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
export const isInlineComponentElement = (element) => {
  const component = getElementComponent(getEditor(), element);

  // The `node` is actually a node class
  return !!component && !!(/** @type {any} */ (component.node).prototype.isInline?.());
};
