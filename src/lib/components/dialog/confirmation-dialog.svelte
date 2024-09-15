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
   * @type {import('$lib/typedefs').ModalProps & import('$lib/typedefs').DialogProps &
   * Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    open = $bindable(false),
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<Dialog {...restProps} bind:open role="alertdialog"></Dialog>
