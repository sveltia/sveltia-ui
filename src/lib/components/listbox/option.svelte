<!--
  @component
  An option within the `<Listbox>` widget. The equivalent of the HTML `<option>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option
  @see https://w3c.github.io/aria/#option
-->
<script>
  import { onMount } from 'svelte';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  export let label = '';
  export let value = undefined;
  export let selected = false;

  /**
   * @type {Button}
   */
  let buttonComponent;

  /**
   * Event listener for the `select` event fired in `group.js`.
   * @param {CustomEvent} event `select` event.
   */
  const listener = ({ type }) => {
    selected = type === 'select';
  };

  onMount(() => {
    buttonComponent.element.addEventListener('select', listener);
    buttonComponent.element.addEventListener('unselect', listener);

    return () => {
      buttonComponent.element.removeEventListener('select', listener);
      buttonComponent.element.removeEventListener('unselect', listener);
    };
  });
</script>

<div class="sui option {className}">
  <Button
    bind:this={buttonComponent}
    tabindex="-1"
    role="option"
    aria-selected={selected}
    {label}
    {value}
    data-type={typeof value}
    {...$$restProps}
    on:click
    on:dragover
    on:dragleave
    on:dragend
    on:drop
  >
    {#if selected}
      <Icon class="check" name="check" />
    {/if}
    <slot name="start-icon" slot="start-icon" />
    <slot />
    <slot name="end-icon" slot="end-icon" />
  </Button>
</div>

<style lang="scss">
  .option {
    display: contents;

    &:focus-visible {
      outline-width: 0 !important;
    }

    :global([role='option']) {
      flex: none;
      display: flex;
      justify-content: space-between;
      gap: 4px;
      border-radius: 4px;
      padding: 0 8px 0 16px;
      width: 100%;
      height: var(--option--medium--height);
      white-space: nowrap;
    }

    :global(.focused),
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
