<!--
  @component
  The container of `<Checkbox>`es.
-->
<script>
  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  /**
   * The `aria-label` attribute on the button element.
   * @type {string}
   */
  export let ariaLabel = '';

  /** @type {('horizontal'|'vertical')} */
  export let orientation = 'horizontal';
</script>

<div
  class="sui checkbox-group {className} {orientation}"
  role="group"
  aria-label={ariaLabel}
  {...$$restProps}
>
  <slot />
</div>

<style lang="scss">
  .checkbox-group {
    display: inline-flex;
    gap: 16px;

    &.horizontal {
      align-items: center;
    }

    &.vertical {
      flex-direction: column;
    }
  }
</style>
