<!--
  @component
  Similar to `PasswordInput`, but it doesn’t use `type="password"` to hide the input value. Instead,
  it relies on CSS to visually conceal the input to prevent password managers from prompting to save
  the password.
  @see https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/-webkit-text-security
-->
<script>
  import MaskedInput from './masked-input.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { CommonEventHandlers, InputEventHandlers, TextInputProps } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {string} [value] Input value.
   * @property {Snippet} [visibilityIcon] Visibility icon slot content.
   */

  /**
   * @type {TextInputProps & CommonEventHandlers & InputEventHandlers & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    value = $bindable(),
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<MaskedInput bind:value {...restProps} mask="css" />
