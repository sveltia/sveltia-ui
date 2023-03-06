<!--
  @component
  @see https://w3c.github.io/aria/#option
-->
<script>
  import Button from './button.svelte';
  import Icon from './icon.svelte';

  /**
   * CSS class name on the button.
   * @type {String}
   */
  let className = '';

  export { className as class };

  export let selected = false;
</script>

<div class="sui option {className}">
  <Button
    role="option"
    aria-selected={selected}
    {...$$restProps}
    on:click
    on:dragover
    on:dragleave
    on:dragend
    on:drop
  >
    <slot />
    {#if selected}
      <Icon class="check" name="check" />
    {/if}
  </Button>
</div>

<style lang="scss">
  .option {
    display: contents;

    :global([role='option']) {
      flex: none;
      display: flex;
      justify-content: space-between;
      gap: 4px;
      border-radius: 4px;
      padding: 0 8px 0 16px;
      width: 100%;
      height: var(--option--medium--height);
    }

    :global([role='option']:hover) {
      color: var(--highlight-foreground-color);
      background-color: var(--highlight-background-color);
    }

    :global([role='option'][aria-selected='true']) {
      :global(.icon) {
        color: var(--primary-accent-color-lighter);
      }
    }
  }
</style>
