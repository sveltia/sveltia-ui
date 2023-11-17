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
   * The `class` attribute on the `<dialog>` element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * Whether to open the dialog.
   * @type {boolean}
   */
  export let open = false;
  /**
   * Text label displayed on the header. Required.
   * @type {string}
   */
  export let title;
  /**
   * Text label displayed on the OK button.
   * @type {string}
   */
  export let okLabel = '';
  /**
   * Text label displayed on the Cancel button.
   * @type {string}
   */
  export let cancelLabel = '';
  /**
   * Value entered on the textbox.
   * @type {string}
   */
  export let value = '';
  /**
   * Extra attributes for the `<TextInput>`
   * @type {object}
   */
  export let textboxAttrs = {};
</script>

<Dialog
  role="alertdialog"
  class={className}
  bind:open
  {title}
  {okLabel}
  {cancelLabel}
  {...$$restProps}
  on:ok
  on:cancel
  on:close
>
  <slot />
  <div class="input-outer">
    {#if $$slots.input}
      <slot name="input" />
    {:else}
      <TextInput bind:value autofocus {...textboxAttrs} on:input on:keydown on:keyup on:keypress />
    {/if}
  </div>
</Dialog>

<style lang="scss">
  .input-outer {
    margin: 12px 0 0;
  }
</style>
