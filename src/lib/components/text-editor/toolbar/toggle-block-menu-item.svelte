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
  import { availableButtons } from '$lib/components/text-editor';
  import MenuItemCheckbox from '$lib/components/menu/menu-item-checkbox.svelte';

  /**
   * Button type.
   * @type {TextEditorBlockType}
   */
  export let type;

  /**
   * Text editor state.
   * @type {TextEditorState}
   */
  const { editor, selectionBlockType } = getContext('state');

  /**
   * Whether the current selection matches the button {@link type}.
   */
  $: selectionTypeMatches = $selectionBlockType === type;

  /**
   * Change the current selection’s type to {@link type}.
   */
  const changeBlockType = () => {
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
    iconName={availableButtons[type].icon}
    label={$_(`_sui.text_editor.${availableButtons[type].labelKey}`)}
    checked={selectionTypeMatches}
    on:click={() => {
      if (!selectionTypeMatches) {
        changeBlockType();
      }
    }}
  />
{/key}
