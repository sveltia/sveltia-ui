<script>
  import { $createCodeNode as createCodeNode } from '@lexical/code-core';
  import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
  import {
    $createHeadingNode as createHeadingNode,
    $createQuoteNode as createQuoteNode,
  } from '@lexical/rich-text';
  import { $setBlocksType as setBlocksType } from '@lexical/selection';
  import { _ } from '@sveltia/i18n';
  import {
    $createParagraphNode as createParagraphNode,
    $getSelection as getSelection,
  } from 'lexical';
  import { getContext } from 'svelte';
  import Icon from '../../icon/icon.svelte';
  import MenuItemCheckbox from '../../menu/menu-item-checkbox.svelte';
  import { AVAILABLE_BUTTONS } from '../constants.js';
  import { focusEditor } from '../core.js';
  import { editRawText, setBlockType } from '../raw-markdown.js';

  /**
   * @import { TextEditorBlockType, TextEditorStore } from '#lib/typedefs.js';
   * @import { HeadingTagType } from '@lexical/rich-text';
   * @import { ElementNode, LexicalCommand } from 'lexical';
   */

  /**
   * Node factories for the block types applied with `$setBlocksType()`, except headings, whose
   * level is parsed from the type.
   * @type {Record<string, () => ElementNode>}
   */
  const NODE_FACTORIES = {
    paragraph: createParagraphNode,
    blockquote: createQuoteNode,
    'code-block': createCodeNode,
  };

  /**
   * Commands for the list block types, which are toggled by the list plugin instead.
   * @type {Record<string, LexicalCommand<void>>}
   */
  const LIST_COMMANDS = {
    'bulleted-list': INSERT_UNORDERED_LIST_COMMAND,
    'numbered-list': INSERT_ORDERED_LIST_COMMAND,
  };

  /**
   * @typedef {object} Props
   * @property {TextEditorBlockType} type Button type.
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
  const selectionTypeMatches = $derived(editorStore.selection.blockType === type);

  /**
   * Change the current selection’s type to {@link type}.
   */
  const changeBlockType = async () => {
    if (!editorStore.useRichText) {
      // The item is only clickable while the `<textarea>` is there
      editRawText(editorStore.textArea, (state) => setBlockType(state, type));

      return;
    }

    // The item is only clickable while the editor is there
    /* v8 ignore next */
    if (!editorStore.editor) {
      return;
    }

    await focusEditor(editorStore.editor);

    const [, headingLevel] = type.match(/^heading-(\d)$/) ?? [];

    const createNode = headingLevel
      ? () => createHeadingNode(/** @type {HeadingTagType} */ (`h${headingLevel}`))
      : NODE_FACTORIES[type];

    if (createNode) {
      editorStore.editor.update(() => {
        setBlocksType(getSelection(), createNode);
      });
    }

    if (type in LIST_COMMANDS) {
      editorStore.editor.dispatchCommand(LIST_COMMANDS[type], undefined);
    }
  };
</script>

{#key selectionTypeMatches}
  <MenuItemCheckbox
    label={_(`_sui.text_editor.${AVAILABLE_BUTTONS[type].labelKey}`)}
    checked={selectionTypeMatches}
    onclick={() => {
      if (!selectionTypeMatches) {
        changeBlockType();
      }
    }}
  >
    {#snippet startIcon()}
      <Icon name={AVAILABLE_BUTTONS[type].icon} />
    {/snippet}
  </MenuItemCheckbox>
{/key}
