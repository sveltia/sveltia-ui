<script>
  import { FORMAT_TEXT_COMMAND } from 'lexical';
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import Button from '$lib/components/button/button.svelte';
  import Icon from '$lib/components/icon/icon.svelte';
  import { availableButtons } from '$lib/components/text-editor';

  /**
   * Button type.
   * @type {TextEditorFormatType}
   */
  export let type;

  /**
   * Text editor state.
   * @type {TextEditorState}
   */
  const { editor, editorId, selectionInlineTypes, useRichText } = getContext('state');
</script>

<Button
  iconic
  aria-label={$_(`_sui.text_editor.${availableButtons[type].labelKey}`)}
  aria-controls="{$editorId}-lexical-root"
  disabled={!$useRichText}
  pressed={$selectionInlineTypes.includes(type)}
  on:click={() => {
    $editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
  }}
>
  <Icon slot="start-icon" name={availableButtons[type].icon} />
</Button>
