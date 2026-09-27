<!--
  @component
  A dialog to insert an editor component in the plain text mode. The component is edited with its
  own field UI in a minimal rich text editor, then inserted into the `<textarea>` as Markdown.
-->
<script>
  import { _ } from '@sveltia/i18n';
  import { getContext } from 'svelte';
  import Dialog from '../../dialog/dialog.svelte';
  import { applyRawTextEdit, getRawTextState, insertMarkdown } from '../raw-markdown.js';
  import ComponentEditor from './component-editor.svelte';

  /**
   * @import { TextEditorComponent, TextEditorStore } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {TextEditorComponent | undefined} component Editor component to insert.
   * @property {boolean} [open] Whether to open the dialog.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    component,
    open = $bindable(false),
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {TextEditorStore} */
  const editorStore = getContext('editorStore');

  let markdown = $state('');
  /** @type {ComponentEditor | undefined} */
  let componentEditor = $state();
  /**
   * Markdown taken from the editor as the dialog starts closing, while it’s still there.
   * @type {string}
   */
  let latestMarkdown = '';

  /**
   * Insert the component’s Markdown into the `<textarea>`, or just bring the focus back there.
   * @param {CustomEvent} event `close` event.
   */
  const onClose = (event) => {
    const { textArea } = editorStore;

    // The dialog can only be opened from a button, which needs the `<textarea>`
    /* v8 ignore next 3 */
    if (!textArea) {
      return;
    }

    if (event.detail.returnValue !== 'cancel' && latestMarkdown) {
      // A component matched by a single-line pattern is inline; anything else is a block
      const block = component?.transformer?.type !== 'text-match';

      applyRawTextEdit(
        textArea,
        insertMarkdown(getRawTextState(textArea), latestMarkdown, { block }),
      );
    } else {
      textArea.focus();
    }

    markdown = '';
    latestMarkdown = '';
  };
</script>

<Dialog
  title={component?.label ?? ''}
  size="large"
  bind:open
  okLabel={_('_sui.insert')}
  okDisabled={!markdown}
  restoreFocus={false}
  onClosing={() => {
    // Get the latest Markdown, as the bound value is updated with a delay
    latestMarkdown = componentEditor?.getMarkdown() ?? markdown;
  }}
  onClose={(event) => {
    onClose(event);
  }}
>
  <!-- The dialog unmounts its content once closed, so each opening gets a fresh editor -->
  {#if component}
    <ComponentEditor bind:this={componentEditor} {component} bind:markdown />
  {/if}
</Dialog>
