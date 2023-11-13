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

<div class="sui text-area {className}" class:disabled hidden={hidden || undefined}>
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
    on:click
    on:input
    on:keypress
  />
  {#if autoResize}
    <div class="clone" aria-hidden="true">{value ?? ''}</div>
  {/if}
</div>

<style lang="scss">
  .text-area {
    display: inline-grid;
    width: 100%;
  }

  textarea,
  .clone {
    grid-area: 1 / 1 / 2 / 2;
    display: block;
    margin: 0;
    border-width: 1px;
    border-color: var(--sui-textbox-border-color);
    border-radius: var(--sui-textbox-border-radius);
    padding: 8px;
    width: 100%;
    min-height: 8em;
    color: var(--sui-textbox-foreground-color);
    background-color: var(--sui-textbox-background-color);
    font-family: var(--sui-textbox-font-family);
    font-size: var(--sui-textbox-font-size);
    line-height: var(--sui-textbox-multiline-line-height);
    transition: all 200ms;

    &.resizing {
      transition-duration: 0ms;
    }

    &:focus {
      border-color: var(--sui-primary-accent-color);
    }

    &:disabled {
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
    visibility: hidden;
    white-space: pre-wrap;
  }
</style>
