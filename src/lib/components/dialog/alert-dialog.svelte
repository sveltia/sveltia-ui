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

<Dialog {...restProps} bind:open role="alertdialog" showCancel={false}></Dialog>
