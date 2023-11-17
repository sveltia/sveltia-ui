<!--
  @component
  A modal confirmation dialog. It shows the OK and Cancel buttons, just like `window.confirm()`.
  @see https://w3c.github.io/aria/#alertdialog
  @see https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
  @see https://developer.mozilla.org/en-US/docs/Web/API/Window/confirm
-->
<script>
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
</Dialog>
