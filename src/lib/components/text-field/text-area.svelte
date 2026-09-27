<!--
  @component
  A multi-line text field based on the HTML `<textarea>` element, providing the auto-resize support.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea
  @see https://w3c.github.io/aria/#textbox
  @see https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/
-->
<script>
  import EmojiAutocomplete from './emoji-autocomplete.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { CommonEventHandlers, HighlightedToken, InputEventHandlers } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {string} [value] Input value.
   * @property {HTMLTextAreaElement} [element] A reference to the `<textarea>` element.
   * @property {boolean} [flex] Make the text input container flexible.
   * @property {'ltr' | 'rtl' | 'auto'} [dir] The `dir` attribute on the `<textarea>` element.
   * @property {string} [name] The `name` attribute on the `<textarea>` element.
   * @property {boolean} [autoResize] Whether to automatically resize the `<textarea>` based on the
   * content.
   * @property {boolean} [useEmojiAutocomplete] Whether to autocomplete emojis when the user
   * types a shortcode, like `:smi`.
   * @property {(value: string) => HighlightedToken[][] | undefined} [highlight] Function to
   * tokenize the value for syntax highlighting, returning one array of tokens per line, or
   * `undefined` to show the text as is, for example while a grammar is still loading. The tokens
   * are painted behind the text, which is made transparent, so the `<textarea>` keeps working as
   * usual. Only styles that keep the text width can be applied, so the glyphs stay aligned.
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
   * @type {CommonEventHandlers & InputEventHandlers & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    value = $bindable(''),
    element = $bindable(),
    flex = false,
    dir = undefined,
    name = undefined,
    autoResize = false,
    useEmojiAutocomplete = false,
    highlight = undefined,
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
   * Content for the clone element used to measure the auto-resized height. A trailing line break is
   * added because browsers don’t render the last empty line, which would otherwise make the clone
   * one line shorter than the `<textarea>`.
   * @type {string}
   */
  const cloneValue = $derived(`${value}\n`);
  /**
   * Syntax-highlighted tokens of the value, flattened with line breaks in between, plus a trailing
   * one like {@link cloneValue}. They’re only used when they add up to the value exactly, since
   * stale tokens would show text different from what’s being edited.
   * @type {HighlightedToken[] | undefined}
   */
  const highlightedTokens = $derived.by(() => {
    const lines = highlight?.(value ?? '');

    if (!lines) {
      return undefined;
    }

    const tokens = lines.flatMap((line) => [...line, { content: '\n' }]);

    return tokens.map(({ content }) => content).join('') === cloneValue ? tokens : undefined;
  });
  /** A reference to the clone element. */
  let cloneElement = $state();

  $effect(() => {
    // Keep the highlighted text scrolled along with the `<textarea>`. It never scrolls when it’s
    // auto-resized
    if (!element || !cloneElement || autoResize) {
      return undefined;
    }

    const textarea = element;
    const clone = cloneElement;

    /**
     * Sync the scroll position.
     */
    const onScroll = () => {
      clone.scrollTop = textarea.scrollTop;
      clone.scrollLeft = textarea.scrollLeft;
    };

    onScroll();
    textarea.addEventListener('scroll', onScroll);

    return () => {
      textarea.removeEventListener('scroll', onScroll);
    };
  });
</script>

<div
  role="none"
  class="sui text-area {className}"
  class:flex
  class:disabled
  class:readonly
  class:highlighted={!!highlightedTokens}
  {hidden}
>
  <textarea
    bind:this={element}
    {...restProps}
    {dir}
    {name}
    bind:value
    disabled={disabled || undefined}
    readonly={readonly || undefined}
    aria-hidden={hidden}
    aria-disabled={disabled}
    aria-readonly={readonly}
    aria-required={required}
    aria-invalid={invalid}
    class:auto-resize={autoResize}></textarea>
  {#if highlightedTokens}
    <!-- Line breaks are only allowed within tags, as any whitespace would end up in the text -->
    <!-- prettier-ignore -->
    <div
      bind:this={cloneElement}
      class="clone"
      class:auto-resize={autoResize}
      aria-hidden="true"
      {dir}
    >{#each highlightedTokens as token, index (index)}<span
          style:color={token.color}
          class:bold={token.bold}
          class:underline={token.underline}
          class:strikethrough={token.strikethrough}
        >{token.content}</span
      >{/each}</div>
  {:else if autoResize}
    <div class="clone auto-resize" aria-hidden="true" {dir}>{cloneValue}</div>
  {/if}
  {#if useEmojiAutocomplete && !disabled && !readonly}
    <EmojiAutocomplete {element} />
  {/if}
</div>

<style lang="scss">
  .text-area {
    position: relative;
    display: inline-grid;
    margin: var(--sui-focus-ring-width);
    min-width: var(--sui-textbox-multiline-min-width);

    &[hidden] {
      display: none;
    }

    &.flex:not([hidden]) {
      display: inline-grid; // Avoid Tailwind .flex class collisions
      width: -moz-available;
      width: -webkit-fill-available;
      width: stretch;
      min-width: 0;
    }
  }

  :is(textarea, .clone) {
    grid-area: 1 / 1 / 2 / 2;
    display: block;
    margin: 0;
    border-width: var(--sui-textbox-border-width, 1px);
    border-color: var(--sui-textbox-border-color);
    border-radius: var(--sui-textbox-border-radius);
    padding: var(--sui-textbox-multiline-padding);
    width: 100%;
    min-height: 8em;
    color: var(--sui-textbox-foreground-color);
    background-color: var(--sui-textbox-background-color);
    font-family: var(--sui-textbox-font-family);
    font-size: var(--sui-textbox-font-size);
    line-height: var(--sui-textbox-multiline-line-height);
    font-weight: var(--sui-textbox-font-weight, var(--sui-font-weight-normal, normal));
    text-align: var(--sui-textbox-text-align, start);
    text-indent: var(--sui-textbox-text-indent, 0);
    text-transform: var(--sui-textbox-text-transform, none);
    letter-spacing: var(--sui-textbox-letter-spacing, normal);
    word-spacing: var(--sui-word-spacing-normal, normal);
    transition: all 200ms;

    &.resizing {
      transition-duration: 0ms;
    }

    &:focus {
      color: var(--sui-textbox-foreground-color-focus, var(--sui-textbox-foreground-color));
      background-color: var(
        --sui-textbox-background-color-focus,
        var(--sui-textbox-background-color)
      );
    }

    // `:read-only` also matches the clone `<div>`
    &:is(:disabled, :read-only):not(.clone) {
      background-color: var(--sui-disabled-background-color);
    }
  }

  textarea {
    resize: vertical;

    &.auto-resize {
      overflow: hidden;
      resize: none;
    }

    &[aria-invalid='true'] {
      border-color: var(--sui-error-border-color);
    }
  }

  .clone {
    overflow: hidden;
    visibility: hidden;

    &:not(.auto-resize) {
      position: absolute;
      inset: 0;
      min-height: 0;
      // Follow the `<textarea>` immediately, even if smooth scrolling is enabled
      scroll-behavior: auto;
    }
  }

  // Paint the highlighted clone behind the `<textarea>`, whose own text becomes transparent but
  // still takes the caret and the selection
  .highlighted {
    textarea {
      z-index: 1;
      caret-color: var(--sui-textbox-foreground-color);

      // Override the base styles, including the focused and disabled ones
      color: transparent !important;
      background-color: transparent !important;

      &:not(.auto-resize) {
        scrollbar-gutter: stable;
      }

      &::placeholder {
        color: var(--sui-textbox-placeholder-foreground-color, var(--sui-textbox-foreground-color));
        opacity: var(--sui-textbox-placeholder-opacity, 1);
      }
    }

    .clone {
      visibility: visible;
      pointer-events: none;

      .bold {
        -webkit-text-stroke: 0.03em currentColor;
      }

      .underline {
        text-decoration-line: underline;
      }

      .strikethrough {
        text-decoration-line: line-through;
      }

      .underline.strikethrough {
        text-decoration-line: underline line-through;
      }

      &:not(.auto-resize) {
        scrollbar-gutter: stable;
      }
    }

    &:focus-within .clone {
      color: var(--sui-textbox-foreground-color-focus, var(--sui-textbox-foreground-color));
      background-color: var(
        --sui-textbox-background-color-focus,
        var(--sui-textbox-background-color)
      );
    }

    &:is(.disabled, .readonly) .clone {
      background-color: var(--sui-disabled-background-color);
    }
  }

  textarea,
  .clone {
    white-space: pre-wrap;
    word-break: normal;
    overflow-wrap: anywhere;
  }
</style>
