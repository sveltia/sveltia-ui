<!--
  @component
  A multi-line text field based on the HTML `<textarea>` element, providing the auto-resize support.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea
  @see https://w3c.github.io/aria/#textbox
  @see https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/
-->
<script>
  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * Make the text input container flexible.
   * @type {boolean}
   */
  export let flex = false;
  /**
   * Whether to hide the widget. An alias of the `aria-hidden` attribute.
   * @type {boolean | undefined}
   */
  export let hidden = undefined;
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
   * Whether to mark the widget required. An alias of the `aria-required` attribute.
   * @type {boolean}
   */
  export let required = false;
  /**
   * Whether to mark the widget invalid. An alias of the `aria-invalid` attribute.
   * @type {boolean}
   */
  export let invalid = false;
  /**
   * The `name` attribute on the `<textarea>` element.
   * @type {string | undefined}
   */
  export let name = undefined;
  /**
   * Input value.
   * @type {string | undefined}
   */
  export let value = undefined;
  /**
   * Whether to automatically resize the `<textarea>` based on the content.
   * @type {boolean}
   */
  export let autoResize = false;
</script>

<div
  role="none"
  class="sui text-area {className}"
  class:flex
  class:disabled
  class:readonly
  hidden={hidden || undefined}
>
  <textarea
    {name}
    bind:value
    disabled={disabled || undefined}
    readonly={readonly || undefined}
    aria-hidden={hidden}
    aria-disabled={disabled}
    aria-readonly={readonly}
    aria-required={required}
    aria-invalid={invalid}
    {...$$restProps}
    class:auto-resize={autoResize}
    on:keydown
    on:keyup
    on:keypress
    on:input
    on:change
  ></textarea>
  {#if autoResize}
    <div class="clone" aria-hidden="true">{value ?? ''}</div>
  {/if}
</div>

<style lang="scss">
  .text-area {
    display: inline-grid;
    margin: var(--sui-focus-ring-width);
    min-width: var(--sui-textbox-multiline-min-width);

    &[hidden] {
      display: none;
    }

    &.flex {
      width: -moz-available;
      width: -webkit-fill-available;
      width: stretch;
      min-width: 0;
    }
  }

  textarea,
  .clone {
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
    font-weight: var(--sui-textbox-font-weight, normal);
    text-align: var(--sui-textbox-text-align, left);
    text-indent: var(--sui-textbox-text-indent, 0);
    text-transform: var(--sui-textbox-text-transform, none);
    letter-spacing: var(--sui-textbox-letter-spacing, normal);
    word-spacing: var(--sui-word-spacing-normal, normal);
    transition: all 200ms;

    &.resizing {
      transition-duration: 0ms;
    }

    &:focus {
      border-color: var(--sui-textbox-border-color-focus, var(--sui-primary-accent-color));
      color: var(--sui-textbox-foreground-color-focus, var(--sui-textbox-foreground-color));
      background-color: var(
        --sui-textbox-background-color-focus,
        var(--sui-textbox-background-color)
      );
    }

    &:disabled,
    &:read-only {
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
      border-color: var(--sui-error-foreground-color);
    }
  }

  .clone {
    overflow: hidden;
    visibility: hidden;
    white-space: pre-wrap;
  }
</style>
