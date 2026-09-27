<script>
  import { $getRoot as getRoot } from 'lexical';
  import { getContext, onMount } from 'svelte';
  import { initEditor, isStaticDecoratorContent } from './core.js';

  /**
   * @import { Snippet } from 'svelte';
   * @import { TextEditorStore } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {'ltr' | 'rtl' | 'auto'} [dir] Direction of the text. With `auto` or no value, each
   * paragraph takes the direction of its own text.
   * @property {boolean} [hidden] Whether to hide the widget.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [readonly] Whether to make the widget read-only. An alias of the
   * `aria-readonly` attribute.
   * @property {boolean} [required] Whether to mark the widget required. An alias of the
   * `aria-required` attribute.
   * @property {boolean} [invalid] Whether to mark the widget invalid. An alias of the
   * `aria-invalid` attribute.
   * @property {Snippet} [children] Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    dir = undefined,
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {TextEditorStore} */
  const editorStore = getContext('editorStore');

  /**
   * Reference to the Lexical editor root element.
   * @type {HTMLElement | undefined}
   */
  let lexicalRoot = $state();

  const editable = $derived(!(disabled || readonly));

  $effect(() => {
    editorStore.editor?.setEditable(editable);
  });

  $effect(() => {
    // Lexical owns the root element’s `dir` attribute, so set the direction on the root node, which
    // the paragraphs then follow. Without one, each paragraph gets `dir="auto"`
    const { editor } = editorStore;
    const direction = dir === 'ltr' || dir === 'rtl' ? dir : null;

    // Check first, as even an update that changes nothing makes the editor convert its content
    if (!editor || editor.getEditorState().read(() => getRoot().getDirection()) === direction) {
      return;
    }

    editor.update(
      () => {
        getRoot().setDirection(direction);
      },
      // Keep the change out of the undo history
      { tag: 'history-merge' },
    );
  });

  /**
   * Update {@link value} and other state variables whenever the editor content is updated.
   * @param {Event} event `Update` custom event.
   */
  const onUpdate = (event) => {
    const { hasConverterError, useRichText, inputValue } = editorStore;

    if (hasConverterError || !useRichText) {
      return;
    }

    const { value: newValue, selection } = /** @type {CustomEvent} */ (event).detail;

    if (inputValue !== newValue) {
      // Temporarily disable rich text to prevent unnecessary Markdown conversion that resets
      // Lexical nodes and selection, then restore the state
      editorStore.useRichText = false;
      editorStore.inputValue = newValue;
      editorStore.useRichText = true;
    }

    editorStore.selection = selection;
  };

  /**
   * Listen to `click` events on the editor. Ignore a click on a link, including one on the text
   * within it, which Lexical renders as a child element of the `<a>`.
   * @param {MouseEvent} event `click` event.
   */
  const onClick = (event) => {
    if (/** @type {HTMLElement} */ (event.target)?.closest('a')) {
      event.preventDefault();
    }
  };

  /**
   * Listen to `mousedown` events on the editor. Keep the caret out of the static content of a
   * decorator node, like the label of an editor component, where typing would do nothing. A label
   * still moves the focus to its control, as that happens on `click`.
   * @param {MouseEvent} event `mousedown` event.
   */
  const onMouseDown = (event) => {
    if (isStaticDecoratorContent(event.target)) {
      event.preventDefault();
    }
  };

  onMount(() => {
    const { editor, enabledTransformers, dispose } = initEditor(editorStore.config);

    editorStore.editor = editor;
    editorStore.enabledTransformers = enabledTransformers;

    lexicalRoot?.addEventListener('Update', onUpdate);
    lexicalRoot?.addEventListener('click', onClick);
    lexicalRoot?.addEventListener('mousedown', onMouseDown);

    return () => {
      lexicalRoot?.removeEventListener('Update', onUpdate);
      lexicalRoot?.removeEventListener('click', onClick);
      lexicalRoot?.removeEventListener('mousedown', onMouseDown);
      dispose();
      editor.setRootElement(null);
      editorStore.initialized = false;
      editorStore.editor = undefined;
    };
  });

  $effect(() => {
    // Both are in place by the time the effect first runs; see `onMount()` above
    /* v8 ignore else */
    if (editorStore.editor && lexicalRoot) {
      editorStore.editor.setRootElement(lexicalRoot);
      editorStore.initialized = true;
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
  class:code={editorStore.config.isCodeEditor}
  id={`${editorStore.editorId}-lexical-root`}
  contenteditable={editable}
  {hidden}
></div>

<style lang="scss">
  .lexical-root {
    overflow: hidden;
    border: 1px solid var(--sui-textbox-border-color);
    border-radius: var(--sui-textbox-border-radius) !important;
    padding: var(--sui-textbox-multiline-padding);
    min-height: 120px;
    color: var(--sui-textbox-foreground-color);
    background-color: var(--sui-textbox-background-color);
    font-family: var(--sui-textbox-font-family);
    font-size: var(--sui-textbox-font-size);
    line-height: var(--sui-textbox-multiline-line-height);

    &:not(:first-child) {
      border-start-start-radius: 0 !important;
      border-start-end-radius: 0 !important;
    }

    &.code {
      padding: 0;

      :global {
        .code-block {
          border-radius: 0 !important;
          min-height: 120px;
        }
      }
    }

    &:focus-visible {
      outline: 0;
    }

    &[aria-invalid='true'] {
      border-color: var(--sui-error-border-color);
    }

    :global {
      // Remove the default margin on the first and last child elements of block nodes, including
      // paragraphs, headings, lists, and code blocks, but keep the default margin on other items,
      // including UI widgets like radio buttons, checkboxes, and select menus
      [dir] {
        &:first-child {
          margin-top: 0;
        }

        &:last-child {
          margin-bottom: 0;
        }
      }

      strong.italic {
        font-style: italic;
      }

      .strikethrough {
        text-decoration: line-through;
      }

      li.nested {
        list-style-type: none;
      }

      .code-block {
        position: relative;
        display: block;
        padding-block: 8px;
        padding-inline-start: 56px;
        padding-inline-end: 8px;
        background-color: var(--sui-code-background-color);
        overflow-x: auto;
        white-space: pre;

        &:not(:first-child) {
          margin-top: 1em;
        }

        &:not(:last-child) {
          margin-bottom: 1em;
        }

        &::before {
          position: absolute;
          inset-block: 0;
          inset-inline-start: 0;
          inset-inline-end: auto;
          content: attr(data-gutter);
          padding: 8px;
          min-width: 40px;
          color: var(--sui-tertiary-foreground-color);
          background-color: var(--sui-tertiary-background-color);
          text-align: end;
        }
      }

      [data-lexical-text='true'] {
        cursor: text;
      }

      :is(th, td) > p {
        margin: 0;
        white-space: normal;
        word-break: normal;
      }

      hr {
        margin: var(--sui-paragraph-margin) 0;
        border: none;
        padding: 0;

        &::after {
          display: block;
          height: 2px;
          background-color: var(--sui-control-border-color);
          line-height: 2px;
          content: '';
        }
      }
    }
  }
</style>
