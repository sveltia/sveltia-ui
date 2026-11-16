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
  import { $insertHorizontalRule as insertHorizontalRule } from '../editing/block.js';
  import { AVAILABLE_BUTTONS } from '../constants.js';
  import { editRawText, insertMarkdown } from '../editing/raw-markdown.js';
  import { HORIZONTAL_RULE_MARKDOWN } from '../conversion/transformers/hr.js';
  import { runEditorAction } from './actions.js';

  /**
   * @import { LexicalEditor } from 'lexical';
   * @import { TextEditorStore } from '#lib/typedefs.js';
   */

  /** @type {TextEditorStore} */
  const editorStore = getContext('editorStore');

  const { labelKey, icon } = AVAILABLE_BUTTONS['horizontal-rule'];

  /**
   * Insert a horizontal rule, then move the focus back to the editor.
   * @returns {Promise<void>} Nothing.
   */
  const insert = () =>
    runEditorAction(editorStore, {
      /**
       * Insert the Markdown.
       * @param {HTMLTextAreaElement} textArea `<textarea>` element.
       * @returns {void | Promise<void>} Nothing.
       */
      raw: (textArea) =>
        editRawText(textArea, (state) =>
          insertMarkdown(state, HORIZONTAL_RULE_MARKDOWN, { block: true }),
        ),
      /**
       * Insert a horizontal rule node.
       * @param {LexicalEditor} editor Editor instance.
       */
      rich: (editor) => {
        editor.update(() => {
          insertHorizontalRule();
        });
      },
    });
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
