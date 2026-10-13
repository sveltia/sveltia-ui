<!--
  @component
  Toolbar menu button to change the text alignment of the selected blocks, showing the current
  alignment. It’s only available for HTML, as Markdown has no syntax for alignment.
-->
<script>
  import { _ } from '@sveltia/i18n';
  import { FORMAT_ELEMENT_COMMAND } from 'lexical';
  import { getContext } from 'svelte';
  import Icon from '../../icon/icon.svelte';
  import MenuButton from '../../menu/menu-button.svelte';
  import MenuItemRadio from '../../menu/menu-item-radio.svelte';
  import Menu from '../../menu/menu.svelte';
  import { ALIGNMENT_OPTIONS } from '../constants.js';
  import { focusEditor } from '../core.js';
  import { waitForMenuToClose } from './menu.js';

  /**
   * @import { TextEditorStore } from '#lib/typedefs.js';
   */

  /** @type {TextEditorStore} */
  const editorStore = getContext('editorStore');

  const alignment = $derived(editorStore.selection.alignment ?? '');
  /**
   * Icon of the current alignment. The default alignment, as well as one the menu doesn’t offer,
   * like `start`, is shown as left aligned.
   */
  const icon = $derived(
    ALIGNMENT_OPTIONS.find(({ type }) => type === alignment)?.icon ?? 'format_align_left',
  );

  /**
   * Align the selected blocks, then move the focus back to the editor.
   * @param {(typeof ALIGNMENT_OPTIONS)[number]['type']} type Alignment.
   * @param {HTMLElement} item Menu item chosen.
   */
  const align = async (type, item) => {
    const { editor } = editorStore;

    // The menu is only shown in the rich text mode, where the editor is there
    /* v8 ignore next 3 */
    if (!editor) {
      return;
    }

    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, type);
    await waitForMenuToClose(item);
    await focusEditor(editor);
  };
</script>

<MenuButton
  aria-label={_('_sui.text_editor.show_alignment_options')}
  aria-controls={editorStore.controlId}
>
  {#snippet startIcon()}
    <Icon name={icon} />
  {/snippet}
  {#snippet popup()}
    <Menu ariaLabel={_('_sui.text_editor.alignment_options')}>
      <!--
        The menu checks the item chosen on its own, which is wrong if nothing could be aligned, like
        when a horizontal rule is selected, so start over whenever the editor reports the selection
      -->
      {#key editorStore.selection}
        {#each ALIGNMENT_OPTIONS as option (option.type)}
          <MenuItemRadio
            label={_(`_sui.text_editor.${option.labelKey}`)}
            checked={alignment === option.type}
            onclick={(/** @type {MouseEvent} */ event) => {
              align(option.type, /** @type {HTMLElement} */ (event.currentTarget));
            }}
          >
            {#snippet startIcon()}
              <Icon name={option.icon} />
            {/snippet}
          </MenuItemRadio>
        {/each}
      {/key}
    </Menu>
  {/snippet}
</MenuButton>
