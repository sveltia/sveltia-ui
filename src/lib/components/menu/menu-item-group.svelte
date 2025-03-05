<!--
  @component
  A menu item group.
-->
<script>
  /**
   * @typedef {object} Props
   * @property {string} [class] - The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] - Whether to hide the widget. An alias of the `aria-hidden`
   * attribute.
   * @property {boolean} [disabled] - Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {string} [title] - Text label displayed above the group items.
   */

  /**
   * @type {import('$lib/typedefs').CommonEventHandlers & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    hidden = false,
    disabled = false,
    title = '',
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();
</script>

<div
  {...restProps}
  role="group"
  {id}
  class="sui menu-item-group {className}"
  {hidden}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-labelledby={title ? `${id}-title` : undefined}
  aria-roledescription="menu item group"
>
  {#if title}
    <div role="none" class="title" id="{id}-title">{title}</div>
  {/if}
  <div role="none" class="inner" inert={disabled}>
    {@render children?.()}
  </div>
</div>

<style lang="scss">
  .inner {
    display: contents;
  }
</style>
