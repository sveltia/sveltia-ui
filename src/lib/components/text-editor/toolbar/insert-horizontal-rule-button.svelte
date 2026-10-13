<!--
  @component
  Toolbar button to insert a horizontal rule: a node in the rich text mode, with the caret moved
  below it, or its Markdown in the plain text mode.
-->
<script>
  import { _ } from '@sveltia/i18n';
  import { getContext } from 'svelte';
  import Button from '../../button/button.svelte';
  import Icon from '../../icon/icon.svelte';
  import { $insertHorizontalRule as insertHorizontalRule } from '../block.js';
  import { AVAILABLE_BUTTONS } from '../constants.js';
  import { focusEditor } from '../core.js';
  import { editRawText, insertMarkdown } from '../raw-markdown.js';
  import { HORIZONTAL_RULE_MARKDOWN } from '../transformers/hr.js';

  /**
   * @import { TextEditorStore } from '#lib/typedefs.js';
   */

  /** @type {TextEditorStore} */
  const editorStore = getContext('editorStore');

  const { labelKey, icon } = AVAILABLE_BUTTONS['horizontal-rule'];

  /**
   * Insert a horizontal rule, then move the focus back to the editor.
   */
  const insert = async () => {
    const { editor, textArea, useRichText } = editorStore;

    if (!useRichText) {
      await editRawText(textArea, (state) =>
        insertMarkdown(state, HORIZONTAL_RULE_MARKDOWN, { block: true }),
      );

      return;
    }

    // The button is only enabled while the editor is there
    /* v8 ignore next 3 */
    if (!editor) {
      return;
    }

    editor.update(() => {
      insertHorizontalRule();
    });

    await focusEditor(editor);
  };
</script>

<Button
  iconic
  aria-label={_(`_sui.text_editor.${labelKey}`)}
  aria-controls={editorStore.controlId}
  onclick={() => {
    insert();
  }}
>
  {#snippet startIcon()}
    <Icon name={icon} />
  {/snippet}
</Button>
