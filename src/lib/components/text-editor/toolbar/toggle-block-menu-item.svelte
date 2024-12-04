<script>
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
  import { availableButtons } from '..';
  import Icon from '../../icon/icon.svelte';
  import MenuItemCheckbox from '../../menu/menu-item-checkbox.svelte';
  import { focusEditor } from '../core';

  /**
   * @typedef {object} Props
   * @property {import('$lib/typedefs').TextEditorBlockType} type - Button type.
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
  const { editor, selectionBlockType } = getContext('state');

  /**
   * Whether the current selection matches the button {@link type}.
   */
  const selectionTypeMatches = $derived($selectionBlockType === type);

  /**
   * Change the current selection’s type to {@link type}.
   */
  const changeBlockType = async () => {
    await focusEditor($editor);

    const [, headingLevel] = type.match(/^heading-(\d)$/) ?? [];

    if (headingLevel) {
      $editor.update(() => {
        setBlocksType(getSelection(), () =>
          createHeadingNode(
            /** @type {import('@lexical/rich-text').HeadingTagType} */ (`h${headingLevel}`),
          ),
        );
      });
    }

    if (type === 'paragraph') {
      $editor.update(() => {
        setBlocksType(getSelection(), () => createParagraphNode());
      });
    }

    if (type === 'bulleted-list') {
      $editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }

    if (type === 'numbered-list') {
      $editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }

    if (type === 'blockquote') {
      $editor.update(() => {
        setBlocksType(getSelection(), () => createQuoteNode());
      });
    }
  };
</script>

{#key selectionTypeMatches}
  <MenuItemCheckbox
    label={$_(`_sui.text_editor.${availableButtons[type].labelKey}`)}
    checked={selectionTypeMatches}
    onclick={() => {
      if (!selectionTypeMatches) {
        changeBlockType();
      }
    }}
  >
    {#snippet startIcon()}
      <Icon name={availableButtons[type].icon} />
    {/snippet}
  </MenuItemCheckbox>
{/key}
