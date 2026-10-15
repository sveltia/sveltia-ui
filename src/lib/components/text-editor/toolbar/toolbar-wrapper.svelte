<script>
  import { getContext } from 'svelte';
  import Toolbar from '../../toolbar/toolbar.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { TextEditorStore } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {Snippet} [children] Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    disabled = false,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {TextEditorStore} */
  const editorStore = getContext('editorStore');

  /**
   * Keep the toolbar height in the store, so the sticky toolbars of nested editors can be placed
   * below this one.
   * @param {HTMLElement} toolbar Toolbar element.
   * @returns {() => void} Cleanup function.
   */
  const observeHeight = (toolbar) => {
    const observer = new ResizeObserver(([entry]) => {
      editorStore.toolbarHeight = entry.borderBoxSize[0].blockSize;
    });

    observer.observe(toolbar);

    return () => {
      observer.disconnect();
      editorStore.toolbarHeight = 0;
    };
  };
</script>

<div role="none" class="wrapper">
  <Toolbar {...restProps} {disabled} {@attach observeHeight}>
    {@render children?.()}
  </Toolbar>
</div>

<style lang="scss">
  .wrapper {
    display: contents;

    :global {
      [role='toolbar'] {
        position: sticky;
        top: var(--sui-text-editor-toolbar-top, 0px);
        z-index: var(--sui-text-editor-toolbar-z-index, 100);
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        border-width: 1px 1px 0;
        border-style: solid;
        border-color: var(--sui-textbox-border-color);
        border-start-start-radius: var(--sui-textbox-border-radius);
        border-start-end-radius: var(--sui-textbox-border-radius);
        border-end-start-radius: 0;
        border-end-end-radius: 0;
        padding: 0 4px;
        height: auto;
        min-height: 40px;
        background-color: var(--sui-tertiary-background-color);

        // Keep the background opaque, so the content scrolled under the sticky toolbar doesn’t show
        // through; the buttons are still dimmed with their `inert` container
        &[aria-disabled='true'] {
          filter: none;
        }
      }

      .sui.menu-button {
        padding: 0 4px;
      }

      .sui.button {
        flex: none;
        margin: 0 !important;
      }

      .sui.button-group {
        gap: 4px;
      }
    }
  }
</style>
