<script>
  import { _ } from '@sveltia/i18n';
  import { FORMAT_TEXT_COMMAND } from 'lexical';
  import { getContext } from 'svelte';
  import Button from '../../button/button.svelte';
  import Icon from '../../icon/icon.svelte';
  import { AVAILABLE_BUTTONS, isHtmlOnlyButton } from '../constants.js';
  import {
    editRawText,
    registerRawTextShortcut,
    toggleInlineFormat,
  } from '../editing/raw-markdown.js';
  import { runEditorAction } from './actions.js';

  /**
   * @import { LexicalEditor } from 'lexical';
   * @import { TextEditorFormatType, TextEditorStore } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {TextEditorFormatType} type Button type.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    type,
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {TextEditorStore} */
  const editorStore = getContext('editorStore');
  const selectionTypeMatches = $derived(editorStore.selection.inlineTypes.includes(type));

  /**
   * Keyboard shortcut keys for the plain text mode. The rich text editor handles them on its own.
   * @type {Record<string, string>}
   */
  const SHORTCUT_KEYS = { bold: 'B', italic: 'I' };

  /**
   * Format the selection.
   * @returns {Promise<void>} Nothing.
   */
  const format = () =>
    runEditorAction(editorStore, {
      /**
       * Format the selected Markdown.
       * @param {HTMLTextAreaElement} textArea `<textarea>` element.
       */
      raw: (textArea) => {
        // The `<textarea>` is only there for Markdown, which hides the HTML-only formats
        /* v8 ignore else */
        if (!isHtmlOnlyButton(type)) {
          editRawText(textArea, (state) => toggleInlineFormat(state, type));
        }
      },
      /**
       * Format the selection.
       * @param {LexicalEditor} editor Editor instance.
       */
      rich: (editor) => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
      },
      // The format applies to the selection, which the focus restores
      focus: 'before',
    });

  $effect(() => {
    const { textArea } = editorStore;
    const key = SHORTCUT_KEYS[type];

    if (!textArea || !key) {
      return undefined;
    }

    // Handle the keyboard shortcut in the plain text mode
    return registerRawTextShortcut(textArea, key, () => {
      format();
    });
  });
</script>

<Button
  iconic
  aria-label={_(`_sui.text_editor.${AVAILABLE_BUTTONS[type].labelKey}`)}
  aria-controls={editorStore.controlId}
  pressed={selectionTypeMatches}
  onclick={() => {
    format();
  }}
>
  {#snippet startIcon()}
    <Icon name={AVAILABLE_BUTTONS[type].icon} />
  {/snippet}
</Button>
