<!--
  @component
  A multi-line text field. The equivalent of the HTML `<textarea>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea
  @see https://w3c.github.io/aria/#textbox
-->
<svelte:options accessors={true} />

<script>
  import { onMount, tick } from 'svelte';

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

  /** @type {string?} */
  let height;
  /** @type {HTMLElement?} */
  let outer = undefined;
  let resizing = false;
  let lastWidth = 0;

  /**
   * Resize the `<textarea>` based on the filled text content.
   */
  const resizeTextarea = async () => {
    resizing = true;
    height = 'auto';

    await tick();

    height = value && element?.scrollHeight ? `${element.scrollHeight + 4}px` : undefined;
    resizing = false;
  };

  /**
   * Call {@link resizeTextarea} whenever the text content is updated.
   */
  $: {
    if (autoResize) {
      // @ts-ignore
      resizeTextarea(value);
    }
  }

  /**
   * Call {@link resizeTextarea} whenever it’s horizontally resized.
   */
  onMount(() => {
    const observer = new ResizeObserver(([{ contentRect }]) => {
      const { width } = contentRect;

      if (autoResize && lastWidth !== width) {
        lastWidth = width;
        resizeTextarea();
      }
    });

    observer.observe(outer);

    // onUnmount
    return () => {
      observer.disconnect();
    };
  });
</script>

<div class="sui text-area {className}" bind:this={outer}>
  <textarea
    name={name || undefined}
    {...$$restProps}
    style:height
    class:resizing
    bind:this={element}
    bind:value
    on:click
    on:input
    on:keypress
  />
</div>

<style lang="scss">
  .text-area {
    width: 100%;
    display: inline-flex;
    align-items: center;
  }

  textarea {
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
    resize: vertical;
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
</style>
