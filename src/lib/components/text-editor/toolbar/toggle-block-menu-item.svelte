<script>
  import { $createCodeNode as createCodeNode } from '@lexical/code-core';
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
  import { AVAILABLE_BUTTONS, LIST_TYPES } from '../constants.js';
  import { editRawText, setBlockType } from '../editing/raw-markdown.js';
  import { runEditorAction } from './actions.js';

  /**
   * @import { TextEditorBlockType, TextEditorStore } from '#lib/typedefs.js';
   * @import { HeadingTagType } from '@lexical/rich-text';
   * @import { ElementNode, LexicalEditor } from 'lexical';
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
   * @returns {Promise<void>} Nothing.
   */
  const changeBlockType = () =>
    runEditorAction(editorStore, {
      /**
       * Change the block type in the Markdown.
       * @param {HTMLTextAreaElement} textArea `<textarea>` element.
       * @returns {void | Promise<void>} Nothing.
       */
      raw: (textArea) => editRawText(textArea, (state) => setBlockType(state, type)),
      /**
       * Change the block type of the selection.
       * @param {LexicalEditor} editor Editor instance.
       */
      rich: (editor) => {
        const [, headingLevel] = type.match(/^heading-(\d)$/) ?? [];

        const createNode = headingLevel
          ? () => createHeadingNode(/** @type {HeadingTagType} */ (`h${headingLevel}`))
          : NODE_FACTORIES[type];

        if (createNode) {
          editor.update(() => {
            setBlocksType(getSelection(), createNode);
          });
        }

        // A list is toggled by its command instead
        const list = LIST_TYPES.find((item) => item.type === type);

        if (list) {
          editor.dispatchCommand(list.command, undefined);
        }
      },
      // The block type applies to the selection, which the focus restores
      focus: 'before',
    });
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
