<!--
  @component
  Toolbar button to insert a table. It opens a dialog to choose the number of rows and columns, then
  inserts an empty table with a header row: a table node in the rich text mode, or its Markdown in
  the plain text mode.
-->
<script>
  import { _ } from '@sveltia/i18n';
  import { matchesShortcuts } from '@sveltia/utils/events';
  import { getContext } from 'svelte';
  import Button from '../../button/button.svelte';
  import Dialog from '../../dialog/dialog.svelte';
  import Icon from '../../icon/icon.svelte';
  import NumberInput from '../../text-field/number-input.svelte';
  import { AVAILABLE_BUTTONS, DEFAULT_TABLE_SIZE, MAX_TABLE_SIZE } from '../constants.js';
  import { focusEditor } from '../core.js';
  import { editRawText, insertMarkdown } from '../raw-markdown.js';
  import { $insertTable as insertTable, createTableMarkdown, parseTableSize } from '../table.js';

  /**
   * @import { TextEditorStore } from '#lib/typedefs.js';
   */

  /**
   * Number of rows, including the header row, and columns of a new table.
   * @typedef {{ rows: number, columns: number }} TableSize
   */

  /**
   * @typedef {object} Props
   * @property {boolean} [disabled] Whether to disable the button, like when the caret is already in
   * a table, as tables can’t be nested.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    disabled = false,
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();

  /** @type {TextEditorStore} */
  const editorStore = getContext('editorStore');

  let openDialog = $state(false);
  /** @type {number | undefined} */
  let rows = $state(DEFAULT_TABLE_SIZE);
  /** @type {number | undefined} */
  let columns = $state(DEFAULT_TABLE_SIZE);

  const rowCount = $derived(parseTableSize(rows));
  const columnCount = $derived(parseTableSize(columns));
  const isValid = $derived(!!rowCount && !!columnCount);

  /**
   * Open the dialog. The size last chosen is kept, unless it was left invalid when the dialog was
   * canceled.
   */
  const onButtonClick = () => {
    if (!rowCount) {
      rows = DEFAULT_TABLE_SIZE;
    }

    if (!columnCount) {
      columns = DEFAULT_TABLE_SIZE;
    }

    openDialog = true;
  };

  /**
   * Handle `keydown` event fired on the input fields on the dialog: insert the table with Enter.
   * @param {KeyboardEvent} event `keydown` event.
   */
  const onInputKeyDown = (event) => {
    if (matchesShortcuts(event, 'Enter') && isValid) {
      openDialog = false;
    }
  };

  /**
   * Insert the table into the rich text editor, then move the focus back to it, where the caret is
   * in the first cell.
   * @param {TableSize} size Table size.
   */
  const insertRichText = async ({ rows: rowSize, columns: columnSize }) => {
    const { editor } = editorStore;

    // The button is only enabled while the editor is there
    /* v8 ignore next 3 */
    if (!editor) {
      return;
    }

    editor.update(() => {
      insertTable(rowSize, columnSize);
    });

    await focusEditor(editor);
  };

  /**
   * Insert the table’s Markdown into the `<textarea>`, with the caret in the first cell.
   * @param {TableSize} size Table size.
   */
  const insertPlainText = async ({ rows: rowSize, columns: columnSize }) => {
    const markdown = createTableMarkdown(rowSize, columnSize);

    await editRawText(editorStore.textArea, (state) => {
      const edit = insertMarkdown(state, markdown, { block: true });
      // Right after the leading pipe and space of the first cell
      const caret = edit.start + edit.text.indexOf(markdown) + 2;

      return { ...edit, selectionStart: caret, selectionEnd: caret };
    });
  };

  /**
   * Handle `close` event fired on the dialog. Insert the table unless the dialog has been canceled.
   * @param {CustomEvent} event `close` event.
   */
  const onDialogClose = async (event) => {
    const canceled = event.detail.returnValue === 'cancel';

    if (!canceled && rowCount && columnCount) {
      const size = { rows: rowCount, columns: columnCount };

      if (editorStore.useRichText) {
        await insertRichText(size);
      } else {
        await insertPlainText(size);
      }

      return;
    }

    // The dialog leaves the focus alone (see `restoreFocus` below), so bring it back here
    if (editorStore.useRichText) {
      // The button is only enabled while the editor is there
      /* v8 ignore else */
      if (editorStore.editor) {
        await focusEditor(editorStore.editor);
      }
    } else {
      editorStore.textArea?.focus();
    }
  };
</script>

<Button
  iconic
  {disabled}
  aria-label={_(`_sui.text_editor.${AVAILABLE_BUTTONS.table.labelKey}`)}
  aria-controls={editorStore.controlId}
  onclick={() => {
    onButtonClick();
  }}
>
  {#snippet startIcon()}
    <Icon name={AVAILABLE_BUTTONS.table.icon} />
  {/snippet}
</Button>

<Dialog
  title={_('_sui.text_editor.insert_table')}
  bind:open={openDialog}
  okDisabled={!isValid}
  okLabel={_('_sui.insert')}
  restoreFocus={false}
  onClose={(event) => {
    onDialogClose(event);
  }}
>
  <div role="none" class="table-size">
    <label for="{id}-rows">{_('_sui.text_editor.rows')}</label>
    <NumberInput
      id="{id}-rows"
      bind:value={rows}
      min={1}
      max={MAX_TABLE_SIZE}
      invalid={!rowCount}
      aria-label={_('_sui.text_editor.rows')}
      onkeydown={(event) => {
        onInputKeyDown(event);
      }}
    />
    <label for="{id}-columns">{_('_sui.text_editor.columns')}</label>
    <NumberInput
      id="{id}-columns"
      bind:value={columns}
      min={1}
      max={MAX_TABLE_SIZE}
      invalid={!columnCount}
      aria-label={_('_sui.text_editor.columns')}
      onkeydown={(event) => {
        onInputKeyDown(event);
      }}
    />
  </div>
</Dialog>

<style lang="scss">
  .table-size {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 8px 16px;
  }
</style>
