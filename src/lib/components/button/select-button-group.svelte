<!--
  @component
  A variant of `<RadioGroup>`, looking like normal buttons.
  @see https://w3c.github.io/aria/#radiogroup
  @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import { activateGroup } from '../util/group';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  export let value = '';
  export let ariaLabel = '';
  export let disabled = false;

  const dispatch = createEventDispatcher();

  /** @type {HTMLElement?} */
  export let element = undefined;

  $: {
    dispatch('change', { value });
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="sui select-button-group {className}"
  tabindex="-1"
  role="radiogroup"
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

    &:focus-visible {
      outline-width: 0 !important;
    }

    :global(button) {
      border-radius: 0;
      color: var(--secondary-foreground-color);

      &:first-child {
        border-radius: 4px 0 0 4px;
      }

      &:not(:first-child) {
        border-left-width: 0;
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