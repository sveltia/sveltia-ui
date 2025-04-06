<script>
  import Toolbar from '../../toolbar/toolbar.svelte';

  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [readonly] Whether to make the widget read-only. An alias of the
   * `aria-readonly` attribute.
   * @property {Snippet} [children] Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    code = $bindable(''),
    lang = $bindable(''),
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

    :global([role='toolbar']) {
      position: sticky;
      top: 0;
      z-index: 1;
      display: flex;
      gap: 8px;
      border-width: 1px 1px 0;
      border-style: solid;
      border-color: var(--sui-textbox-border-color);
      border-radius: var(--sui-textbox-border-radius) var(--sui-textbox-border-radius) 0 0;
      padding: 8px;
      background-color: var(--sui-tertiary-background-color);

      @media (width < 768px) {
        flex-wrap: wrap;
        height: auto;
      }
    }

    :global(.sui.menu-button) {
      padding: 0 4px;
    }

    :global(.sui.button) {
      flex: none;
      margin: 0 !important;
    }

    :global(.sui.button-group) {
      gap: 4px;
    }
  }
</style>
