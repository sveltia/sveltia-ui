<!--
  @component
  The container of `<TabList>` and `<TabPanels>`. The component name derives from XUL. This can be
  omitted if not using vertical tabs.
-->
<script>
  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {'horizontal' | 'vertical'} [orientation] Orientation of the widget. This is
   * typically contrary to `<TabList>`’s `orientation`.
   * @property {Snippet} [children] Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    orientation = 'vertical',
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div {...restProps} role="none" class="sui tab-box {orientation} {className}">
  {@render children?.()}
</div>

<style lang="scss">
  .tab-box {
    display: flex;

    &.vertical {
      flex-direction: column;
    }
  }
</style>
