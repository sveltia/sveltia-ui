<script>
  import { $createParagraphNode as createParagraphNode, $getRoot as getRoot } from 'lexical';
  import { getContext, onMount } from 'svelte';

  /**
   * @typedef {object} Props
   * @property {string | undefined} [value] - Input value.
   * @property {string} [class] - The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] - Whether to hide the widget.
   * @property {boolean} [disabled] - Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [readonly] - Whether to make the widget read-only. An alias of the
   * `aria-readonly` attribute.
   * @property {boolean} [required] - Whether to mark the widget required. An alias of the
   * `aria-required` attribute.
   * @property {boolean} [invalid] - Whether to mark the widget invalid. An alias of the
   * `aria-invalid` attribute.
   * @property {import('svelte').Snippet} [children] - Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    value = $bindable(),
    class: className,
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * Text editor state.
   * @type {import('$lib/typedefs').TextEditorState}
   */
  const { editor, editorId, selectionBlockType, selectionInlineTypes, hasConverterError } =
    getContext('state');

  /**
   * Reference to the Lexical editor root element.
   * @type {HTMLElement | undefined}
   */
  let lexicalRoot = $state();

  const editable = $derived(!(disabled || readonly));

  $effect(() => {
    $editor?.setEditable(editable);
  });

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
    lexicalRoot?.addEventListener('Update', onUpdate);
    lexicalRoot?.addEventListener('click', onClick);

    return () => {
      lexicalRoot?.removeEventListener('Update', onUpdate);
      lexicalRoot?.removeEventListener('click', onClick);
    };
  });

  $effect(() => {
    if ($editor && lexicalRoot) {
      $editor.setRootElement(lexicalRoot);
      // We should avoid an empty editor; there should be at least one `<p>`
      // @see https://github.com/facebook/lexical/issues/2308
      $editor.update(() => {
        getRoot().append(createParagraphNode());
      });
    }
  });
</script>

<div
  bind:this={lexicalRoot}
  {...restProps}
  role="textbox"
  aria-multiline="true"
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-readonly={readonly}
  aria-required={required}
  aria-invalid={invalid}
  class="lexical-root"
  id="{$editorId}-lexical-root"
  contenteditable={editable}
  {hidden}
></div>

<style lang="scss">
  .lexical-root {
    border: 1px solid var(--sui-textbox-border-color);
    border-radius: 0 0 var(--sui-textbox-border-radius) var(--sui-textbox-border-radius) !important;
    padding: var(--sui-textbox-multiline-padding);
    min-height: 8em;
    color: var(--sui-textbox-foreground-color);
    background-color: var(--sui-textbox-background-color);
    font-family: var(--sui-textbox-font-family);
    font-size: var(--sui-textbox-font-size);
    line-height: var(--sui-textbox-multiline-line-height);

    &:focus-visible {
      outline: 0;
    }

    &[aria-invalid='true'] {
      border-color: var(--sui-error-foreground-color);
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

    :global(li.nested) {
      list-style-type: none;
    }

    :global([data-lexical-text='true']) {
      cursor: text;
    }
  }
</style>
