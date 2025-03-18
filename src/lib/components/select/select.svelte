<!--
  @component
  A select-only variant of `<Combobox>`. The equivalent of the HTML `<select>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
  @see https://w3c.github.io/aria/#combobox
  @see https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/
-->
<script>
  import Combobox from './combobox.svelte';

  /**
   * @import { ComboboxProps } from '$lib/typedefs';
   */

  /**
   * @type {ComboboxProps & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    value = $bindable(),
    class: className,
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    children,
    onChange,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<Combobox
  {...restProps}
  bind:value
  class="sui select {className}"
  {hidden}
  {disabled}
  {readonly}
  {required}
  {invalid}
  {onChange}
  editable={false}
>
  {@render children?.()}
</Combobox>
