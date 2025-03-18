<!--
  @component
  A variant of `<Radio>`, looking like a normal button.
  @see https://w3c.github.io/aria/#radio
  @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script>
  import Button from './button.svelte';

  /**
   * @import { ButtonProps, CommonEventHandlers } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {boolean} [selected] Whether to select the widget. An alias of the `aria-checked`
   * attribute. Because the UI is a button, we expose `selected` instead of `checked`.
   */

  /**
   * @type {ButtonProps & CommonEventHandlers & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    selected = $bindable(false),
    class: className,
    onChange,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<Button
  {...restProps}
  role="radio"
  class="sui select-button {className}"
  aria-checked={selected}
  onChange={(event) => {
    selected = event.detail.selected;
    onChange?.(event);
  }}
></Button>
