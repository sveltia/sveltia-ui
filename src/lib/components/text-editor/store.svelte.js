import { generateElementId } from '@sveltia/utils/element';
import { convertMarkdownToLexical } from './core';

/**
 * @import { TextEditorConfig, TextEditorSelectionState, TextEditorStore } from '$lib/typedefs';
 * @import { LexicalEditor } from 'lexical';
 */

/**
 * Create an editor editor store that contains all the states and configuration.
 * @returns {TextEditorStore} Store.
 */
export const createEditorStore = () => {
  /** @type {string} */
  const editorId = generateElementId('editor');
  /** @type {boolean} */
  let initialized = $state(false);
  /** @type {LexicalEditor | undefined} */
  let editor = $state();
  /** @type {TextEditorConfig} */
  let config = $state({ modes: [], enabledButtons: [], components: [], isCodeEditor: false });
  /** @type {string} */
  let inputValue = $state('');
  /** @type {TextEditorSelectionState} */
  let selection = $state({ blockNodeKey: null, blockType: 'paragraph', inlineTypes: [] });
  /** @type {boolean} */
  let useRichText = $state(true);
  /** @type {boolean} */
  let hasConverterError = $state(false);
  /** @type {boolean} */
  let showConverterError = $state(false);

  /**
   * Convert the Markdown {@link inputValue} to Lexical nodes. Disable the rich text mode and
   * restore the original value when there is an error while conversion.
   */
  const convertMarkdown = async () => {
    if (!editor || !initialized) {
      return;
    }

    const originalValue = inputValue;

    try {
      // We should avoid an empty editor; there should be at least one `<p>`, so give it an empty
      // string if the `value` is `undefined`
      // @see https://github.com/facebook/lexical/issues/2308
      await convertMarkdownToLexical(editor, inputValue || '');
    } catch (ex) {
      hasConverterError = true;
      inputValue = originalValue;
      // eslint-disable-next-line no-console
      console.error(ex);
    }
  };

  return {
    /* eslint-disable jsdoc/require-jsdoc */
    get editor() {
      return editor;
    },
    set editor(newValue) {
      editor = newValue;
    },
    get initialized() {
      return initialized;
    },
    set initialized(newValue) {
      initialized = newValue;
    },
    get config() {
      return config;
    },
    set config(newValue) {
      config = newValue;
      useRichText = newValue.modes[0] === 'rich-text';
    },
    get inputValue() {
      return inputValue;
    },
    set inputValue(newValue) {
      const hasChange = inputValue !== newValue;

      if (hasChange) {
        inputValue = newValue;
      }

      if (useRichText && (hasChange || editor?.getEditorState().isEmpty())) {
        convertMarkdown();
      }
    },
    get selection() {
      return selection;
    },
    set selection(newValue) {
      selection = newValue;
    },
    get useRichText() {
      return useRichText;
    },
    set useRichText(newValue) {
      useRichText = newValue;
    },
    get hasConverterError() {
      return hasConverterError;
    },
    set hasConverterError(newValue) {
      hasConverterError = newValue;

      if (hasConverterError) {
        useRichText = false;
        showConverterError = true;
      }
    },
    get showConverterError() {
      return showConverterError;
    },
    set showConverterError(newValue) {
      showConverterError = newValue;
    },
    editorId,
    convertMarkdown,
    /* eslint-enable jsdoc/require-jsdoc */
  };
};
