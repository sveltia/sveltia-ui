<!--
  @component
  Button on the table cell where the caret is, at its top end corner, that opens the table menu to
  insert and delete rows and columns, the same way it works in the Lexical Playground. The same menu
  is also available on the toolbar, which is easier to reach with the keyboard.
  @see https://playground.lexical.dev/
-->
<script>
  import { _ } from '@sveltia/i18n';
  import { getContext, onMount } from 'svelte';
  import Icon from '../icon/icon.svelte';
  import MenuButton from '../menu/menu-button.svelte';
  import {
    $getSelectedTableCellKey as getSelectedTableCellKey,
    isRightToLeftTable,
  } from './table.js';
  import TableActionMenu from './toolbar/table-action-menu.svelte';

  /**
   * @import { PopupPosition, TextEditorStore } from '#lib/typedefs.js';
   */

  /**
   * Space between the button and the cell border.
   */
  const OFFSET = 4;

  /** @type {TextEditorStore} */
  const editorStore = getContext('editorStore');

  /**
   * Key of the table cell the selection is in, if any.
   * @type {string | null}
   */
  let cellKey = $state(null);
  /**
   * Whether the focus is within the editor, or on the menu opened from the button. The button is
   * hidden otherwise, so it doesn’t linger once the user has moved on.
   */
  let hasFocus = $state(false);
  /**
   * Position of the button relative to the editor wrapper: the top end corner of the cell.
   * @type {{ top: number, left: number, rtl: boolean, popupPosition: PopupPosition } |
   * undefined}
   */
  let position = $state.raw();
  /**
   * A reference to the element positioning the button.
   * @type {HTMLElement | undefined}
   */
  let container = $state();

  const show = $derived(!!cellKey && hasFocus && !!position && editorStore.useRichText);
  const style = $derived(position ? `top: ${position.top}px; left: ${position.left}px` : undefined);

  /**
   * Get the editor wrapper, which the button is positioned against.
   * @returns {HTMLElement | null | undefined} Wrapper.
   */
  const getWrapper = () => container?.parentElement;

  /**
   * Move the button to the top end corner of the cell, as much of it as is visible: a wide table
   * can be scrolled horizontally within its wrapper, and the editor can be scrolled itself when its
   * height is limited. Nothing is measured while the button is hidden for the lack of focus.
   */
  const reposition = () => {
    const wrapper = getWrapper();
    const cell = cellKey ? editorStore.editor?.getElementByKey(cellKey) : undefined;

    if (!hasFocus || !wrapper || !cell) {
      position = undefined;

      return;
    }

    const cellRect = cell.getBoundingClientRect();

    // The table is wrapped with an element scrolling it horizontally; see `initEditor()`
    const tableRect = /** @type {HTMLElement} */ (
      cell.closest('.table-wrapper')
    ).getBoundingClientRect();

    // The cell is in the editor root
    const rootRect = /** @type {HTMLElement} */ (
      cell.closest('.lexical-root')
    ).getBoundingClientRect();

    const wrapperRect = wrapper.getBoundingClientRect();
    const rtl = isRightToLeftTable(cell);
    const left = Math.max(cellRect.left, tableRect.left);
    const right = Math.min(cellRect.right, tableRect.right);
    const top = Math.max(cellRect.top, rootRect.top);
    const bottom = Math.min(cellRect.bottom, rootRect.bottom);

    // The cell is not laid out, e.g. while the editor is hidden, or scrolled out of view
    if (right <= left || bottom <= top) {
      position = undefined;

      return;
    }

    position = {
      top: top - wrapperRect.top + OFFSET,
      left: (rtl ? left + OFFSET : right - OFFSET) - wrapperRect.left,
      rtl,
      // Open the menu toward the inline end, so it doesn’t cover the cell
      popupPosition: rtl ? 'bottom-right' : 'bottom-left',
    };
  };

  /**
   * Timer to check the focus once it has settled.
   * @type {number | undefined}
   */
  let focusTimer;

  /**
   * Check whether the focus is within the editor, or on the menu, once it has settled. While it
   * moves, it’s on `<body>` for a moment.
   */
  const updateFocus = () => {
    window.clearTimeout(focusTimer);
    focusTimer = window.setTimeout(() => {
      const wrapper = getWrapper();

      hasFocus =
        !!wrapper?.contains(document.activeElement) ||
        !!container?.querySelector('[aria-expanded="true"]');
      reposition();
    });
  };

  $effect(() => {
    const { editor } = editorStore;

    // The root initializes the editor before this first runs
    /* v8 ignore next 3 */
    if (!editor) {
      return undefined;
    }

    const unregisterUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      cellKey = editorState.read(getSelectedTableCellKey);
      reposition();
    });

    // Follow the cell when a wide table is scrolled, or the editor is resized
    const unregisterRootListener = editor.registerRootListener((root) => {
      if (!root) {
        return undefined;
      }

      const resizeObserver = new ResizeObserver(reposition);

      root.addEventListener('scroll', reposition, { capture: true });
      resizeObserver.observe(root);

      return () => {
        root.removeEventListener('scroll', reposition, { capture: true });
        resizeObserver.disconnect();
      };
    });

    return () => {
      unregisterUpdateListener();
      unregisterRootListener();
    };
  });

  onMount(() => {
    window.addEventListener('resize', reposition);
    document.addEventListener('focusin', updateFocus);
    document.addEventListener('focusout', updateFocus);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('resize', reposition);
      document.removeEventListener('focusin', updateFocus);
      document.removeEventListener('focusout', updateFocus);
    };
  });
</script>

<div
  role="none"
  class="table-cell-menu-button"
  class:rtl={position?.rtl}
  hidden={!show}
  {style}
  bind:this={container}
>
  {#if show && cellKey}
    {@const key = cellKey}
    <MenuButton
      iconic
      size="small"
      variant="tertiary"
      popupPosition={position?.popupPosition}
      aria-label={_('_sui.text_editor.show_table_options')}
      aria-controls={editorStore.controlId}
    >
      {#snippet endIcon()}
        <Icon name="expand_more" />
      {/snippet}
      {#snippet popup()}
        <TableActionMenu cellKey={key} />
      {/snippet}
    </MenuButton>
  {/if}
</div>

<style lang="scss">
  .table-cell-menu-button {
    position: absolute;
    z-index: 1;
    // Align the end of the button with the end of the cell
    translate: -100% 0;

    &.rtl {
      translate: 0 0;
    }

    &[hidden] {
      display: none;
    }

    :global {
      .sui.button {
        margin: 0;
        border-radius: 50%;
        background-color: var(--sui-secondary-background-color);
      }
    }
  }
</style>
