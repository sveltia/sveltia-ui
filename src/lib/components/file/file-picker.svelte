<script>
  /**
   * @typedef {object} Props
   * @property {string} [accept] The `accept` attribute for the `<input type="file">`.
   * @property {boolean} [multiple] Whether to accept multiple files.
   * @property {(detail: { files: File[], file: File }) => void} [onSelect] Custom `select` event
   * handler. Since `multiple` could be false, we pass both `file` and `files` with the arguments.
   * @property {() => void} [onCancel] `cancel` event handler.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    accept = undefined,
    multiple = false,
    onSelect = undefined,
    onCancel = undefined,
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {HTMLInputElement | undefined} */
  let filePicker = $state();

  /**
   * Show the browser’s file picker dialog.
   */
  export const open = () => {
    filePicker?.click();
  };
</script>

<input
  class="sui file-picker"
  type="file"
  hidden
  {accept}
  {multiple}
  bind:this={filePicker}
  onchange={({ target }) => {
    const files = [.../** @type {FileList} */ (/** @type {HTMLInputElement} */ (target).files)];

    onSelect?.({ files, file: files[0] });
  }}
  oncancel={(event) => {
    event.stopPropagation();
    onCancel?.();
  }}
/>
