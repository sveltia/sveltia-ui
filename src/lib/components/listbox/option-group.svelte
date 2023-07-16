<!--
  @component
  A group within a `<Listbox>`. The equivalent of the HTML `<optgroup>` element. It can contain one
  or more `<Option>`s.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup
  @see https://w3c.github.io/aria/#listbox
  @see https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-grouped/
-->
<script>
  import { getRandomId } from '../util/util';

  /**
   * CSS class name on the group.
   * @type {string}
   */
  let className = '';

  export { className as class };

  /**
   * The group’s label to be displayed above the child `<Option>`s.
   */
  export let label = '';

  const id = getRandomId('optgroup');
</script>

<div
  {id}
  class="sui optgroup {className}"
  role="group"
  aria-labelledby="{id}-label"
  {...$$restProps}
>
  <div id="{id}-label" class="label" role="none">{label}</div>
  <slot />
</div>

<style lang="scss">
  .optgroup {
    &:not(:first-child) {
      margin: 12px 0 0;
    }
  }

  .label {
    margin: 8px;
    color: var(--sui-secondary-foreground-color);
    font-size: var(--sui-font-size-small);
  }
</style>
