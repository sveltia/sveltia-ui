<script>
  import { FORMAT_TEXT_COMMAND } from 'lexical';
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { availableButtons } from '..';
  import Button from '../../button/button.svelte';
  import Icon from '../../icon/icon.svelte';

  /**
   * Button type.
   * @type {import('$lib/typedefs').TextEditorFormatType}
   */
  export let type;

  /**
   * Text editor state.
   * @type {import('$lib/typedefs').TextEditorState}
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
