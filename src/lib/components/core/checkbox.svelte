<!--
  @component
  @see https://w3c.github.io/aria/#checkbox
  @see https://w3c.github.io/aria-practices/#checkbox
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import { getRandomId } from '../helpers/util';
  import Button from './button.svelte';
  import Icon from './icon.svelte';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  /** @type {string} */
  export let name = '';

  /** @type {(string | undefined)} */
  export let value = undefined;

  /** @type {(boolean | string | undefined)} */
  export let checked = false;

  /** @type {boolean} */
  export let indeterminate = false;

  /** @type {boolean} */
  export let disabled = false;

  const dispatch = createEventDispatcher();
  const id = getRandomId('checkbox');
  /** @type {Button} */
  let button;
</script>

{#if name && value && checked && !indeterminate}
  <input type="hidden" {name} {value} />
{/if}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<label
  class="sui checkbox {className}"
  class:checked
  class:indeterminate
  class:disabled
  on:click|preventDefault|stopPropagation={(event) => {
    if (!event.target.matches('button')) {
      button.element.click();
    }
  }}
>
  <Button
    {id}
    {disabled}
    role="checkbox"
    aria-checked={indeterminate ? 'mixed' : checked}
    aria-labelledby="{id}-label"
    bind:this={button}
    on:click={(event) => {
      event.preventDefault();
      event.stopPropagation();
      checked = indeterminate ? true : !checked;
      indeterminate = false;
      dispatch('change', { checked });
    }}
  >
    <Icon slot="start-icon" name={indeterminate ? 'remove' : 'check'} />
  </Button>
  {#if $$slots.default}
    <label id="{id}-label">
      <slot />
    </label>
  {/if}
</label>

<style lang="scss">
  .checkbox {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: inherit;
    cursor: pointer;
    -webkit-user-select: none;
    user-select: none;

    &.disabled {
      cursor: default;
    }

    :global(button) {
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-width: 2px;
      border-color: var(--control-border-color);
      border-radius: 4px;
      width: 24px;
      height: 24px;
      color: var(--primary-accent-color-lighter);
      transition: all 200ms;

      :global(.icon) {
        font-size: var(--font-size--xx-large);
      }
    }

    :global(button[aria-checked='true']),
    :global(button[aria-checked='mixed']) {
      color: var(--primary-accent-color-lighter);
    }

    :global(button[aria-checked='false']) {
      color: transparent;
    }
  }
</style>
