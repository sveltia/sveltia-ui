<script>
  import Toolbar from '../../toolbar/toolbar.svelte';

  /**
   * @import { Snippet } from 'svelte';
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
</script>

<div role="none" class="wrapper">
  <Toolbar {...restProps} {disabled}>
    {@render children?.()}
  </Toolbar>
</div>

<style lang="scss">
  .wrapper {
    display: contents;

    :global {
      [role='toolbar'] {
        position: sticky;
        top: 0;
        z-index: 100;
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
