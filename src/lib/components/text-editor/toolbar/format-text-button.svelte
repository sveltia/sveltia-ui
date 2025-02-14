<script>
  import { FORMAT_TEXT_COMMAND } from 'lexical';
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { availableButtons } from '..';
  import Button from '../../button/button.svelte';
  import Icon from '../../icon/icon.svelte';
  import { focusEditor } from '../core';

  /**
   * @typedef {object} Props
   * @property {import('$lib/typedefs').TextEditorFormatType} type - Button type.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    type,
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {import('$lib/typedefs').TextEditorStore} */
  const editorStore = getContext('editorStore');
  const selectionTypeMatches = $derived(editorStore.selection.inlineTypes.includes(type));
</script>

<Button
  iconic
  aria-label={$_(`_sui.text_editor.${availableButtons[type].labelKey}`)}
  aria-controls="{editorStore.editorId}-lexical-root"
  disabled={!editorStore.useRichText}
  pressed={selectionTypeMatches}
  onclick={async () => {
    if (editorStore.editor) {
      await focusEditor(editorStore.editor);
      editorStore.editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
    }
  }}
>
  {#snippet startIcon()}
    <Icon name={availableButtons[type].icon} />
  {/snippet}
</Button>
