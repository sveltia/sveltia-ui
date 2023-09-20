<!--
  @component
  A multi-line text field based on the HTML `<textarea>` element, providing the auto-resize support.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea
  @see https://w3c.github.io/aria/#textbox
  @see https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/
-->
<svelte:options accessors={true} />

<script>
  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  /** @type {HTMLTextAreaElement?} */
  export let element = undefined;

  export let name = '';

  /** @type {string?} */
  export let value = undefined;

  export let autoResize = false;
</script>

<div class="sui text-area {className}">
  <textarea
    name={name || undefined}
    {...$$restProps}
    class:auto-resize={autoResize}
    bind:this={element}
    bind:value
    on:click
    on:input
    on:keypress
  />
  {#if autoResize}
    <div class="clone" aria-hidden="true">{value}</div>
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
    border-color: var(--sui-control-border-color);
    border-radius: var(--sui-textbox-medium-border-radius);
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
      opacity: 0.4;
      cursor: default;
    }
  }

  textarea {
    resize: vertical;

    &.auto-resize {
      overflow: hidden;
      resize: none;
    }
  }

  .clone {
    visibility: hidden;
    white-space: pre-wrap;
  }
</style>
