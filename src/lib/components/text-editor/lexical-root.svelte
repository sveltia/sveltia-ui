<script>
  import { getContext, onMount } from 'svelte';
  import { initEditor } from './core';

  /**
   * @import { Snippet } from 'svelte';
   * @import { TextEditorStore } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
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
   * Listen to `click` events on the editor. Ignore a click on a link.
   * @param {MouseEvent} event `click` event.
   */
  const onClick = (event) => {
    if (/** @type {HTMLElement} */ (event.target)?.matches('a')) {
      event.preventDefault();
    }
  };

  onMount(() => {
    editorStore.editor = initEditor(editorStore.config);

    lexicalRoot?.addEventListener('Update', onUpdate);
    lexicalRoot?.addEventListener('click', onClick);

    return () => {
      lexicalRoot?.removeEventListener('Update', onUpdate);
      lexicalRoot?.removeEventListener('click', onClick);
    };
  });

  $effect(() => {
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
  id="{editorStore.editorId}-lexical-root"
  contenteditable={editable}
  {hidden}
></div>

<style lang="scss">
  .lexical-root {
    overflow: hidden;
    border: 1px solid var(--sui-textbox-border-color);
    border-radius: var(--sui-textbox-border-radius) !important;
    padding: var(--sui-textbox-multiline-padding);
    min-height: 8em;
    color: var(--sui-textbox-foreground-color);
    background-color: var(--sui-textbox-background-color);
    font-family: var(--sui-textbox-font-family);
    font-size: var(--sui-textbox-font-size);
    line-height: var(--sui-textbox-multiline-line-height);

    &:not(:first-child) {
      border-top-left-radius: 0 !important;
      border-top-right-radius: 0 !important;
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
      :first-child {
        margin-top: 0;
      }

      :last-child {
        margin-bottom: 0;
      }

      strong.italic {
        font-style: italic;
      }

      li.nested {
        list-style-type: none;
      }

      .code-block {
        position: relative;
        display: block;
        padding: 8px 8px 8px 56px;
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
          inset: 0 auto 0 0;
          content: attr(data-gutter);
          padding: 8px;
          min-width: 40px;
          color: var(--sui-tertiary-foreground-color);
          background-color: var(--sui-tertiary-background-color);
          text-align: right;
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
    }
  }

  // Part of the Default Prism theme
  :root[data-theme='light'] .lexical-root {
    :global {
      .token:is(.comment, .prolog, .doctype, .cdata) {
        color: slategray;
      }

      .token.punctuation {
        color: #999;
      }

      .token.namespace {
        opacity: 0.7;
      }

      .token:is(.property, .tag, .boolean, .number, .constant, .symbol, .deleted) {
        color: #905;
      }

      .token:is(.selector, .attr-name, .string, .char, .builtin, .inserted) {
        color: #690;
      }

      .token:is(.operator, .entity, .url),
      .language-css .token.string,
      .style .token.string {
        color: #9a6e3a;
      }

      .token:is(.atrule, .attr-value, .keyword) {
        color: #07a;
      }

      .token:is(.function, .class-name) {
        color: #dd4a68;
      }

      .token:is(.regex, .important, .variable) {
        color: #e90;
      }
    }
  }

  // Part of the Tomorrow Night Prism theme
  :root[data-theme='dark'] .lexical-root {
    :global {
      .token:is(.comment, .block-comment, .prolog, .doctype, .cdata) {
        color: #999;
      }

      .token.punctuation {
        color: #ccc;
      }

      .token:is(.tag, .attr-name, .namespace, .deleted) {
        color: #e2777a;
      }

      .token.function-name {
        color: #6196cc;
      }

      .token:is(.boolean, .number, .function) {
        color: #f08d49;
      }

      .token:is(.property, .class-name, .constant, .symbol) {
        color: #f8c555;
      }

      .token:is(.selector, .important, .atrule, .keyword, .builtin) {
        color: #cc99cd;
      }

      .token:is(.string, .char, .attr-value, .regex, .variable) {
        color: #7ec699;
      }

      .token:is(.operator, .entity, .url) {
        color: #67cdcc;
      }

      .token:is(.important, .bold) {
        font-weight: bold;
      }

      .token.italic {
        font-style: italic;
      }

      .token.entity {
        cursor: help;
      }

      .token.inserted {
        color: green;
      }
    }
  }
</style>
