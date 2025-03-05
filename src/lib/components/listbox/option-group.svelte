<!--
  @component
  A group within a `<Listbox>`. The equivalent of the HTML `<optgroup>` element. It can contain one
  or more `<Option>`s.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup
  @see https://w3c.github.io/aria/#listbox
  @see https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-grouped/
-->
<script>
  /**
   * @typedef {object} Props
   * @property {string} [class] - The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] - Whether to hide the widget. An alias of the `aria-hidden`
   * attribute.
   * @property {boolean} [disabled] - Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {string} [label] - The group’s label to be displayed above the child `<Option>`s.
   * @property {import('svelte').Snippet} [children] - Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    hidden = false,
    disabled = false,
    label = '',
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
  class="sui option-group {className}"
  {hidden}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-labelledby="{id}-label"
  aria-roledescription="option group"
>
  <div role="none" id="{id}-label" class="label">{label}</div>
  <div role="none" class="inner" inert={disabled}>
    {@render children?.()}
  </div>
</div>

<style lang="scss">
  .option-group {
    &:not(:first-child) {
      margin: 12px 0 0;
    }
  }

  .label {
    margin: 8px;
    color: var(--sui-secondary-foreground-color);
    font-size: var(--sui-font-size-small);
  }

  .inner {
    display: contents;
  }
</style>
