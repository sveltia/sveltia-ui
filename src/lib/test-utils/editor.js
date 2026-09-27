/**
 * Helpers for testing the text editor components.
 */

import { DecoratorNode } from 'lexical';

/**
 * @import { ComponentProps } from 'svelte';
 * @import { TextEditorComponent, TextEditorStore } from '$lib/typedefs';
 * @import EditorFixture from '$lib/components/text-editor/editor-fixture.test.svelte';
 */

/**
 * Get the editor store the fixture has bound to its props. The fixture creates the store as it
 * initializes, so it’s always there once the fixture has rendered.
 * @param {ComponentProps<typeof EditorFixture>} props Fixture props.
 * @returns {TextEditorStore} Store.
 */
export const getEditorStore = ({ store }) => /** @type {TextEditorStore} */ (store);

/**
 * Create an editor component for testing: a decorator node that is exported as the given Markdown.
 * @param {object} args Arguments.
 * @param {string} args.id Component ID.
 * @param {string} args.label Component label.
 * @param {string | (() => string)} args.markdown Markdown the node is exported as, or a function
 * returning it.
 * @param {boolean} [args.inline] Whether the component is inline, matched by a single-line pattern.
 * @returns {TextEditorComponent} Component.
 */
export const createTestComponent = ({ id, label, markdown, inline = false }) => {
  /**
   * Decorator node rendering the component label.
   * @augments {DecoratorNode<null>}
   */
  class TestNode extends DecoratorNode {
    /**
     * Get the node type.
     * @returns {string} Type.
     */
    static getType() {
      return id;
    }

    /**
     * Clone the given node.
     * @param {TestNode} node Node.
     * @returns {TestNode} New node.
     */
    static clone(node) {
      return new TestNode(node.__key);
    }

    /**
     * Whether the node is inline.
     * @returns {boolean} Result.
     */
    isInline() {
      return inline;
    }

    /**
     * Create the DOM.
     * @returns {HTMLElement} Element.
     */
    createDOM() {
      const element = document.createElement('span');

      element.textContent = label;

      return element;
    }

    /**
     * The DOM never has to be recreated.
     * @returns {boolean} Result.
     */
    updateDOM() {
      return false;
    }

    /**
     * Nothing to decorate.
     * @returns {null} Nothing.
     */
    decorate() {
      return null;
    }
  }

  /**
   * Export a node to Markdown.
   * @param {any} node Node.
   * @returns {string | null} Markdown, if the node is a test node.
   */
  const exportNode = (node) => {
    if (!(node instanceof TestNode)) {
      return null;
    }

    return typeof markdown === 'function' ? markdown() : markdown;
  };

  return {
    id,
    label,
    node: /** @type {any} */ (TestNode),
    /**
     * Create a new node.
     * @returns {TestNode} Node.
     */
    createNode: () => new TestNode(),
    transformer: /** @type {any} */ (
      inline
        ? { type: 'text-match', dependencies: [TestNode], regExp: /^$/, export: exportNode }
        : {
            type: 'multiline-element',
            dependencies: [TestNode],
            regExpStart: /^$/,
            /**
             * Never import the node from Markdown.
             * @returns {boolean} Result.
             */
            replace: () => false,
            export: exportNode,
          }
    ),
  };
};
