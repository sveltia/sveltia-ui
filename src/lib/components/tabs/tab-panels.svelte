<!--
  @component
  The container of `<TabPanel>`s. The component name derives from XUL. This can be omitted if the
  child tab panels don’t need a sliding animation.
-->
<script>
  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
</script>

<div role="none" class="sui tab-panels {className}">
  <slot />
</div>

<style lang="scss">
  .tab-panels {
    flex: auto;
    display: flex;
    gap: var(--sui-tab-panels-gap, 16px);
    overflow: hidden;
    scroll-snap-type: x mandatory;

    & > :global(.tab-panel) {
      flex: none;
      display: block !important;
      width: 100%;
      overflow: auto;
      scroll-snap-align: center;
    }
  }
</style>
