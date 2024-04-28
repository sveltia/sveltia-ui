<script>
  import { getContext, onMount } from 'svelte';

  /**
   * Whether to disable the widget. An alias of the `aria-disabled` attribute.
   * @type {boolean}
   */
  export let disabled = false;
  /**
   * Whether to disable the widget. An alias of `aria-readonly` attribute.
   * @type {boolean}
   */
  export let readonly = false;
  /**
   * Input value.
   * @type {string | undefined}
   */
  export let value = undefined;

  /**
   * Text editor state.
   * @type {TextEditorState}
   */
  const {
    editor,
    editorId,
    selectionBlockType,
    selectionInlineTypes,
    useRichText,
    hasConverterError,
  } = getContext('state');

  /**
   * Reference to the Lexical editor root element.
   * @type {HTMLElement | undefined}
   */
  let lexicalRoot = undefined;

  $: editable = !(disabled || readonly);
  $: $editor.setEditable(editable);

  /**
   * Update {@link value} and other state variables whenever the editor content is updated.
   * @param {Event} event - `Update` custom event.
   */
  const onUpdate = (event) => {
    if ($hasConverterError) {
      return;
    }

    const { detail } = /** @type {CustomEvent} */ (event);
    const newValue = detail.value;

    if (value !== newValue) {
      value = newValue;
    }

    $selectionBlockType = detail.selectionBlockType;
    $selectionInlineTypes = detail.selectionInlineTypes;
  };

  /**
   * Listen to `click` events on the editor. Ignore a click on a link.
   * @param {MouseEvent} event - `click` event.
   */
  const onClick = (event) => {
    if (/** @type {HTMLElement} */ (event.target)?.matches('a')) {
      event.preventDefault();
    }
  };

  onMount(() => {
    if (lexicalRoot) {
      $editor.setRootElement(lexicalRoot);
      lexicalRoot.addEventListener('Update', onUpdate);
      lexicalRoot.addEventListener('click', onClick);
    }

    return () => {
      lexicalRoot?.removeEventListener('Update', onUpdate);
      lexicalRoot?.removeEventListener('click', onClick);
    };
  });
</script>

<div
  role="textbox"
  aria-multiline="true"
  aria-disabled={disabled}
  aria-readonly={readonly}
  class="lexical-root"
  id="{$editorId}-lexical-root"
  contenteditable={editable}
  bind:this={lexicalRoot}
  hidden={!$useRichText}
></div>

<style lang="scss">
  .lexical-root {
    border: 1px solid var(--sui-textbox-border-color);
    border-radius: 0 0 var(--sui-textbox-border-radius) var(--sui-textbox-border-radius) !important;
    padding: 16px;
    min-height: 8em;
    color: var(--sui-textbox-foreground-color);
    background-color: var(--sui-textbox-background-color);
    font-family: var(--sui-textbox-font-family);
    font-size: var(--sui-textbox-font-size);
    line-height: var(--sui-textbox-multiline-line-height);

    &:focus-visible {
      outline: 0;
    }

    & > :global(:first-child) {
      margin-top: 0;
    }

    & > :global(:last-child) {
      margin-bottom: 0;
    }

    :global(strong.italic) {
      font-style: italic;
    }

    :global([data-lexical-text='true']) {
      cursor: text;
    }
  }
</style>
