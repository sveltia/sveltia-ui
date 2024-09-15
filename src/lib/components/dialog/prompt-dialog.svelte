<!--
  @component
  A modal prompt dialog. It shows the OK and Cancel buttons as well as a textbox, just like
  `window.prompt()`.
  @see https://w3c.github.io/aria/#alertdialog
  @see https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
  @see https://developer.mozilla.org/en-US/docs/Web/API/Window/prompt
-->
<script>
  import TextInput from '../text-field/text-input.svelte';
  import Dialog from './dialog.svelte';

  /**
   * @typedef {object} Props
   * @property {string} [value] - Value entered on the textbox.
   * @property {object} [textboxAttrs] - Extra attributes for the `<TextInput>`.
   * @property {import('svelte').Snippet} [children] - Primary slot content.
   * @property {import('svelte').Snippet} [input] - Input slot content.
   */

  /**
   * @type {import('$lib/typedefs').ModalProps & import('$lib/typedefs').DialogProps &
   * import('$lib/typedefs').CommonEventHandlers & import('$lib/typedefs').InputEventHandlers &
   * Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    open = $bindable(false),
    value = $bindable(''),
    textboxAttrs = {},
    children,
    input,
    onkeydown,
    onkeyup,
    onkeypress,
    oninput,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<Dialog {...restProps} bind:open role="alertdialog">
  {@render children?.()}
  <div class="input-outer">
    {#if input}
      {@render input()}
    {:else}
      <TextInput
        bind:value
        flex
        autofocus
        {...textboxAttrs}
        {onkeydown}
        {onkeyup}
        {onkeypress}
        {oninput}
      />
    {/if}
  </div>
</Dialog>

<style lang="scss">
  .input-outer {
    margin: 12px 0 0;
  }
</style>
