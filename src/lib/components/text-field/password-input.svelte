<!--
  @component
  The equivalent of the HTML `<input type="password">` element, but it comes with the Show/Hide
  button.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/password
  @see https://w3c.github.io/aria/#textbox
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

<MaskedInput bind:value {...restProps} mask="type" />
