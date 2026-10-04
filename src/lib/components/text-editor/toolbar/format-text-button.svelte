<script>
  import { _ } from '@sveltia/i18n';
  import { FORMAT_TEXT_COMMAND } from 'lexical';
  import { getContext } from 'svelte';
  import Button from '../../button/button.svelte';
  import Icon from '../../icon/icon.svelte';
  import { AVAILABLE_BUTTONS } from '../constants.js';
  import { focusEditor } from '../core.js';
  import { editRawText, registerRawTextShortcut, toggleInlineFormat } from '../raw-markdown.js';

  /**
   * @import { TextEditorFormatType, TextEditorStore } from '$lib/typedefs';
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
   */
  const format = async () => {
    const { editor, textArea, useRichText } = editorStore;

    if (!useRichText) {
      // The button is only enabled while the `<textarea>` is there
      editRawText(textArea, (state) => toggleInlineFormat(state, type));

      return;
    }

    // The button is only enabled while the editor is there
    /* v8 ignore else */
    if (editor) {
      await focusEditor(editor);
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
    }
  };

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
