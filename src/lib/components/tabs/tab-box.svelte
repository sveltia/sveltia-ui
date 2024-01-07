<!--
  @component
  The container of `<TabList>` and `<TabPanels>`. The component name derives from XUL. This can be
  omitted if not using vertical tabs.
-->
<script>
  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };

  /**
   * Orientation of the widget. This is typically contrary to `<TabList>`’s `orientation`.
   * @type {'horizontal' | 'vertical'}
   */
  export let orientation = 'vertical';
</script>

<div role="none" class="sui tab-box {orientation} {className}">
  <slot />
</div>

<style lang="scss">
  .tab-box {
    display: flex;

    &.vertical {
      flex-direction: column;
    }
  }
</style>
