<script>
  import { FORMAT_TEXT_COMMAND } from 'lexical';
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { availableButtons } from '..';
  import Button from '../../button/button.svelte';
  import Icon from '../../icon/icon.svelte';

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
  onclick={() => {
    $editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
  }}
>
  {#snippet startIcon()}
    <Icon name={availableButtons[type].icon} />
  {/snippet}
</Button>
