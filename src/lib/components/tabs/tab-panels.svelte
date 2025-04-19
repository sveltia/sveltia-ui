<!--
  @component
  The container of `<TabPanel>`s. The component name derives from XUL. This can be omitted if the
  child tab panels don’t need a sliding animation.
-->
<script>
  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {Snippet} [children] Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div {...restProps} role="none" class="sui tab-panels {className}">
  {@render children?.()}
</div>

<style lang="scss">
  .tab-panels {
    flex: auto;
    display: flex;
    gap: var(--sui-tab-panels-gap, 16px);
    overflow: hidden;
    scroll-snap-type: x mandatory;

    :global {
      & > .tab-panel {
        flex: none;
        display: block !important;
        width: 100%;
        overflow: auto;
        scroll-snap-align: center;
      }
    }
  }
</style>
