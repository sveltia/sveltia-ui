<!--
  @component
  A generic group layout.
  @see https://w3c.github.io/aria/#group
-->
<script>
  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * Whether to hide the widget. An alias of the `aria-hidden` attribute.
   * @type {boolean | undefined}
   */
  export let hidden = undefined;
  /**
   * Whether to disable the widget. An alias of the `aria-disabled` attribute.
   * @type {boolean}
   */
  export let disabled = false;
</script>

<div
  class="sui group {className}"
  role="group"
  hidden={hidden || undefined}
  aria-hidden={hidden}
  aria-disabled={disabled}
  {...$$restProps}
>
  <div class="inner" inert={disabled}>
    <slot />
  </div>
</div>

<style lang="scss">
  .inner {
    display: contents;
  }
</style>
