<script>
  import { getContext, onMount } from 'svelte';

  /**
   * @typedef {object} Props
   * @property {string} [value] - Input value.
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
      border-color: var(--sui-error-border-color);
    }

    & > :global(:first-child) {
      margin-top: 0;
    }

    & > :global(:last-child) {
      margin-bottom: 0;
    }

    :global {
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
      }

      .code-block:not(:first-child) {
        margin-top: 1em;
      }

      .code-block:not(:last-child) {
        margin-bottom: 1em;
      }

      .code-block::before {
        position: absolute;
        inset: 0 auto 0 0;
        content: attr(data-gutter);
        padding: 8px;
        min-width: 40px;
        color: var(--sui-tertiary-foreground-color);
        background-color: var(--sui-secondary-background-color);
        text-align: right;
      }

      [data-lexical-text='true'] {
        cursor: text;
      }
    }
  }

  // Part of the Default Prism theme
  :root[data-theme='light'] .lexical-root {
    :global {
      .token.comment,
      .token.prolog,
      .token.doctype,
      .token.cdata {
        color: slategray;
      }

      .token.punctuation {
        color: #999;
      }

      .token.namespace {
        opacity: 0.7;
      }

      .token.property,
      .token.tag,
      .token.boolean,
      .token.number,
      .token.constant,
      .token.symbol,
      .token.deleted {
        color: #905;
      }

      .token.selector,
      .token.attr-name,
      .token.string,
      .token.char,
      .token.builtin,
      .token.inserted {
        color: #690;
      }

      .token.operator,
      .token.entity,
      .token.url,
      .language-css .token.string,
      .style .token.string {
        color: #9a6e3a;
      }

      .token.atrule,
      .token.attr-value,
      .token.keyword {
        color: #07a;
      }

      .token.function,
      .token.class-name {
        color: #dd4a68;
      }

      .token.regex,
      .token.important,
      .token.variable {
        color: #e90;
      }
    }
  }

  // Part of the Tomorrow Night Prism theme
  :root[data-theme='dark'] .lexical-root {
    :global {
      .token.comment,
      .token.block-comment,
      .token.prolog,
      .token.doctype,
      .token.cdata {
        color: #999;
      }

      .token.punctuation {
        color: #ccc;
      }

      .token.tag,
      .token.attr-name,
      .token.namespace,
      .token.deleted {
        color: #e2777a;
      }

      .token.function-name {
        color: #6196cc;
      }

      .token.boolean,
      .token.number,
      .token.function {
        color: #f08d49;
      }

      .token.property,
      .token.class-name,
      .token.constant,
      .token.symbol {
        color: #f8c555;
      }

      .token.selector,
      .token.important,
      .token.atrule,
      .token.keyword,
      .token.builtin {
        color: #cc99cd;
      }

      .token.string,
      .token.char,
      .token.attr-value,
      .token.regex,
      .token.variable {
        color: #7ec699;
      }

      .token.operator,
      .token.entity,
      .token.url {
        color: #67cdcc;
      }

      .token.important,
      .token.bold {
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
