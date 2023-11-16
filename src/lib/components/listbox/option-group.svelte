<!--
  @component
  A group within a `<Listbox>`. The equivalent of the HTML `<optgroup>` element. It can contain one
  or more `<Option>`s.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup
  @see https://w3c.github.io/aria/#listbox
  @see https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-grouped/
-->
<script>
  import { getRandomId } from '../../services/util';

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
  /**
   * The group’s label to be displayed above the child `<Option>`s.
   */
  export let label = '';

  const id = getRandomId('optgroup');
</script>

<div
  role="group"
  {id}
  class="sui option-group {className}"
  hidden={hidden || undefined}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-labelledby="{id}-label"
  aria-roledescription="option group"
  {...$$restProps}
>
  <div role="none" id="{id}-label" class="label">{label}</div>
  <div role="none" class="inner" inert={disabled}>
    <slot />
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
