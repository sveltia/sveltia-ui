<!--
  @component
  A progressbar widget.
  @see https://w3c.github.io/aria/#progressbar
-->
<script>
  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {number} now The `aria-valuenow` attribute on the wrapper element.
   * @property {number} [min] The `aria-valuemin` attribute on the wrapper element.
   * @property {number} [max] The `aria-valuemax` attribute on the wrapper element.
   * @property {string} [text] The `aria-valuetext` attribute on the wrapper element.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    now = 0,
    min = 0,
    max = 100,
    text,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div
  {...restProps}
  role="progressbar"
  class="sui progressbar {className}"
  aria-valuenow={now}
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuetext={text}
>
  <div role="none" style:width="{now}%"></div>
</div>

<style lang="scss">
  .progressbar {
    overflow: hidden;
    border-width: var(--sui-progressbar-border-width, 1px);
    border-style: var(--sui-progressbar-border-style, solid);
    border-color: var(--sui-progressbar-border-color, var(--sui-control-border-color));
    border-radius: var(--sui-progressbar-border-radius, 16px);
    width: var(--sui-progressbar-width, 240px);
    height: var(--sui-progressbar-height, 10px);
    background-color: var(
      --sui-progressbar-background-color,
      var(--sui-secondary-background-color)
    );

    div {
      height: 100%;
      background-color: var(
        --sui-progressbar-foreground-color,
        var(--sui-primary-accent-color-light)
      );
      transition: width 250ms;
    }
  }
</style>
