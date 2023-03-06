<!--
  @component
  @see https://w3c.github.io/aria/#textbox
-->
<svelte:options accessors={true} />

<script>
  /**
   * CSS class name on the button.
   * @type {String}
   */
  // eslint-disable-next-line padding-line-between-statements
  let className = '';

  export { className as class };

  /** @type {(HTMLTextAreaElement|undefined)} */
  export let element = undefined;

  export let name = '';

  /** @type {(String|undefined)} */
  export let value = undefined;

  export let autoResize = false;

  /** @type {(String|undefined)} */
  let height;

  const resizeTextarea = () => {
    height = 'auto';

    window.requestAnimationFrame(() => {
      height = value && element?.scrollHeight ? `${element.scrollHeight + 4}px` : undefined;
    });
  };

  $: {
    if (value && autoResize) {
      resizeTextarea();
    }
  }
</script>

<div class="sui text-area {className}">
  <textarea
    name={name || undefined}
    {...$$restProps}
    style:height
    bind:this={element}
    on:click
    on:input
    on:keypress
    on:input={() => {
      value = element.value;
    }}>{value}</textarea
  >
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
    border-color: var(--control-border-color);
    border-radius: var(--input--medium--border-radius);
    background-color: var(--control-background-color);
    padding: 8px;
    width: 100%;
    min-height: 8em;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    line-height: 1.75;
    resize: vertical;
    transition: all 200ms;

    &:focus {
      border-color: var(--primary-accent-color);
    }

    &:disabled {
      background-color: var(--disabled-background-color);
      opacity: 0.4;
      cursor: default;
    }
  }
</style>
