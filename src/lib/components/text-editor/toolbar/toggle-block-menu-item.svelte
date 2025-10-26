<script>
  import { $createCodeNode as createCodeNode } from '@lexical/code';
  import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
  import {
    $createHeadingNode as createHeadingNode,
    $createQuoteNode as createQuoteNode,
  } from '@lexical/rich-text';
  import { $setBlocksType as setBlocksType } from '@lexical/selection';
  import {
    $createParagraphNode as createParagraphNode,
    $getSelection as getSelection,
  } from 'lexical';
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import Icon from '../../icon/icon.svelte';
  import MenuItemCheckbox from '../../menu/menu-item-checkbox.svelte';
  import { AVAILABLE_BUTTONS } from '../constants.js';
  import { focusEditor } from '../core.js';

  /**
   * @import { TextEditorBlockType, TextEditorStore } from '$lib/typedefs';
   * @import { HeadingTagType } from '@lexical/rich-text';
   */

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
    if (!editorStore.editor) {
      return;
    }

    await focusEditor(editorStore.editor);

    const [, headingLevel] = type.match(/^heading-(\d)$/) ?? [];

    if (headingLevel) {
      editorStore.editor.update(() => {
        setBlocksType(getSelection(), () =>
          createHeadingNode(/** @type {HeadingTagType} */ (`h${headingLevel}`)),
        );
      });
    }

    if (type === 'paragraph') {
      editorStore.editor.update(() => {
        setBlocksType(getSelection(), () => createParagraphNode());
      });
    }

    if (type === 'bulleted-list') {
      editorStore.editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }

    if (type === 'numbered-list') {
      editorStore.editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }

    if (type === 'blockquote') {
      editorStore.editor.update(() => {
        setBlocksType(getSelection(), () => createQuoteNode());
      });
    }

    if (type === 'code-block') {
      editorStore.editor.update(() => {
        setBlocksType(getSelection(), () => createCodeNode());
      });
    }
  };
</script>

{#key selectionTypeMatches}
  <MenuItemCheckbox
    label={$_(`_sui.text_editor.${AVAILABLE_BUTTONS[type].labelKey}`)}
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
