<!--
  @component
  A modal alert dialog. It only shows the OK button, just like `window.alert()`.
  @see https://w3c.github.io/aria/#alertdialog
  @see https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
  @see https://developer.mozilla.org/en-US/docs/Web/API/Window/alert
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
</script>

<Dialog
  role="alertdialog"
  class={className}
  bind:open
  {title}
  {okLabel}
  showCancel={false}
  {...$$restProps}
  on:ok
  on:cancel
  on:close
>
  <slot />
</Dialog>
