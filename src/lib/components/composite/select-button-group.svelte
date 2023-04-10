<!--
  @component
  A variant of `<RadioButtonGroup>`, looking like normal buttons.
  @see https://w3c.github.io/aria/#radiogroup
  @see https://w3c.github.io/aria-practices/#radiobutton
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import { activateGroup } from '../helpers/group';

  /**
   * CSS class name on the button.
   * @type {String}
   */
  let className = '';

  export { className as class };

  export let value = '';
  export let ariaLabel = '';
  export let disabled = false;

  const dispatch = createEventDispatcher();

  /** @type {(HTMLElement|undefined)} */
  export let element = undefined;

  $: {
    dispatch('change', { value });
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="sui select-button-group {className}"
  role="radiogroup"
  tabindex="0"
  aria-label={ariaLabel || undefined}
  aria-disabled={disabled ? true : undefined}
  bind:this={element}
  on:click={({ target }) => {
    if (target.matches('[role="radio"]')) {
      value = target.value;
    }
  }}
  use:activateGroup
>
  <slot />
</div>

<style lang="scss">
  .select-button-group {
    display: inline-flex;
    align-items: center;

    :global(button) {
      border-radius: 0;
      color: var(--secondary-foreground-color);

      &:first-child {
        border-radius: 4px 0 0 4px;
      }

      &:not(:first-child) {
        margin-left: -1px;
      }

      &:last-child {
        border-radius: 0 4px 4px 0;
      }
    }

    :global(button[aria-checked='true']) {
      color: var(--highlight-foreground-color);
      background-color: var(--highlight-background-color);
    }
  }
</style>
