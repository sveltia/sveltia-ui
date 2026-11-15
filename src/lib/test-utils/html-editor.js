/* eslint-disable jsdoc/require-jsdoc */

/**
 * Helpers to test the HTML import and export of the rich text editor with a real editor.
 */

import { DecoratorNode } from 'lexical';
import { BLOCK_BUTTON_TYPES, INLINE_BUTTON_TYPES } from '../components/text-editor/constants.js';
import { initEditor } from '../components/text-editor/core.js';
import {
  convertHtmlToLexical,
  convertMarkdownToLexical,
} from '../components/text-editor/conversion/import.js';
import { exportHtml } from '../components/text-editor/conversion/html/index.js';

/**
 * @import { LexicalEditor } from 'lexical';
 * @import { Transformer } from '@lexical/markdown';
 * @import { TextEditorConfig } from '#lib/typedefs.js';
 */

/** @type {(() => void)[]} */
const disposers = [];

/**
 * Dispose of the editors created since the last call. Call it in `afterEach()`.
 */
export const disposeEditors = () => {
  disposers.splice(0).forEach((dispose) => dispose());
};

/**
 * Create an editor attached to a root element.
 * @param {Partial<TextEditorConfig>} [config] Editor configuration.
 * @returns {{ editor: LexicalEditor, enabledTransformers: Transformer[] }} Editor and transformers.
 */
export const createEditor = (config = {}) => {
  const { editor, enabledTransformers, dispose } = initEditor({
    modes: ['rich-text'],
    enabledButtons: [...INLINE_BUTTON_TYPES, ...BLOCK_BUTTON_TYPES],
    components: [],
    useMarkdownShortcuts: true,
    isCodeEditor: false,
    format: 'html',
    ...config,
  });

  editor.setRootElement(document.createElement('div'));
  disposers.push(dispose);

  return { editor, enabledTransformers };
};

/**
 * Import the given Markdown to a new HTML editor, and export the content as HTML.
 * @param {string} markdown Markdown.
 * @returns {Promise<string>} HTML.
 */
export const markdownToHtml = async (markdown) => {
  const { editor, enabledTransformers } = createEditor();

  await convertMarkdownToLexical(editor, markdown, enabledTransformers);

  return editor.read(() => exportHtml(editor));
};

/**
 * Import the given HTML to a new editor, and export the content as HTML.
 * @param {string} html HTML.
 * @param {Partial<TextEditorConfig>} [config] Editor configuration.
 * @returns {Promise<string | undefined>} HTML.
 */
export const roundTrip = async (html, config) =>
  convertHtmlToLexical(createEditor(config).editor, html);

/**
 * Create the Lexical node class of an editor component that imports the elements of the given type
 * the given function accepts, and exports its element as is.
 * @param {object} args Arguments.
 * @param {string} args.type Node type.
 * @param {string} args.tagName Name of the elements the component imports.
 * @param {(element: HTMLElement) => boolean} args.accepts Whether the component imports an element.
 * @param {boolean} args.inline Whether the component is inline.
 * @returns {any} Node class.
 */
export const createComponentNode = ({ type, tagName, accepts, inline }) => {
  /**
   * Node standing in for an editor component.
   * @augments {DecoratorNode<null>}
   */
  class ComponentNode extends DecoratorNode {
    /** @type {string} */
    __html = '';

    static getType() {
      return type;
    }

    /**
     * Clone the node.
     * @param {ComponentNode} node Node.
     * @returns {ComponentNode} Clone.
     */
    static clone(node) {
      const clone = new ComponentNode(node.__key);

      clone.__html = node.__html;

      return clone;
    }

    static importJSON() {
      return new ComponentNode();
    }

    static importDOM() {
      return {
        /**
         * Get the conversion for an element.
         * @param {HTMLElement} element Element.
         * @returns {any} Conversion.
         */
        [tagName]: (element) =>
          accepts(element)
            ? {
                conversion: () => {
                  const node = new ComponentNode();

                  node.__html = element.outerHTML;

                  return { node, after: () => [] };
                },
                priority: 4,
              }
            : null,
      };
    }

    createDOM() {
      return document.createElement('span');
    }

    updateDOM() {
      return false;
    }

    isInline() {
      return inline;
    }

    decorate() {
      return null;
    }

    exportDOM() {
      const template = document.createElement('template');

      template.innerHTML = this.__html;

      return { element: template.content };
    }
  }

  return ComponentNode;
};

/**
 * Inline editor component node exporting a `<figure class="caption">`, like an image with a
 * caption, which is block-level although the component is inline.
 */
export const CaptionedImageNode = createComponentNode({
  type: 'test-captioned-image',
  tagName: 'figure',
  accepts: (element) => element.classList.contains('caption'),
  inline: true,
});

/**
 * Inline editor component node exporting a `<video>`, which a paragraph can hold.
 */
export const VideoNode = createComponentNode({
  type: 'test-video',
  tagName: 'video',
  accepts: () => true,
  inline: true,
});

/**
 * Create an editor with a block figure component for `<figure class="photo">`, an inline image
 * component for `<img>`, an inline captioned image component for `<figure class="caption">` and
 * an inline video component for `<video>`.
 * @returns {LexicalEditor} Editor.
 */
export const createEditorWithComponents = () =>
  createEditor({
    components: /** @type {any[]} */ ([
      {
        id: 'figure',
        label: 'Figure',
        node: createComponentNode({
          type: 'test-figure',
          tagName: 'figure',
          accepts: (element) => element.classList.contains('photo'),
          inline: false,
        }),
        transformer: {},
      },
      {
        id: 'captioned-image',
        label: 'Captioned Image',
        node: CaptionedImageNode,
        transformer: {},
      },
      { id: 'video', label: 'Video', node: VideoNode, transformer: {} },
      {
        id: 'image',
        label: 'Image',
        node: createComponentNode({
          type: 'test-image',
          tagName: 'img',
          accepts: () => true,
          inline: true,
        }),
        transformer: {},
      },
    ]),
  }).editor;
