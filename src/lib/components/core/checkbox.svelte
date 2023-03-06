<!--
  @component
  @see https://w3c.github.io/aria/#checkbox
  @see https://w3c.github.io/aria-practices/#checkbox
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import { getRandomId } from '../helpers/util';
  import Button from './button.svelte';

  /**
   * CSS class name on the button.
   * @type {String}
   */
  let className = '';

  export { className as class };

  /** @type {String} */
  export let name = '';

  /** @type {(String|undefined)} */
  export let value = undefined;

  /** @type {(Boolean|String|undefined)} */
  export let checked = false;

  /** @type {Boolean} */
  export let indeterminate = false;

  const dispatch = createEventDispatcher();
  const id = getRandomId('checkbox');
  /** @type {Button} */
  let button;

  $: {
    dispatch('change', { checked });
  }
</script>

{#if name && value && checked && !indeterminate}
  <input type="hidden" {name} {value} />
{/if}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<label
  class="sui checkbox {className}"
  on:click|preventDefault|stopPropagation={(event) => {
    if (!event.target.matches('button')) {
      button.element.click();
    }
  }}
>
  <Button
    {id}
    iconName={indeterminate ? 'remove' : 'check'}
    role="checkbox"
    aria-checked={indeterminate ? 'mixed' : checked}
    aria-labelledby="{id}-label"
    bind:this={button}
    on:click={(event) => {
      event.preventDefault();
      event.stopPropagation();
      checked = indeterminate ? true : !checked;
      indeterminate = false;
    }}
  />
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
        font-size: 20px;
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
