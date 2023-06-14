<!--
  @component
  The equivalent of the HTML `<input type="checkbox">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox
  @see https://w3c.github.io/aria/#checkbox
  @see https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import { getRandomId } from '../util/util';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  /** @type {string} */
  export let name = '';

  /** @type {string?} */
  export let label = undefined;

  /** @type {string?} */
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
  let buttonComponent;
</script>

{#if name && value && checked && !indeterminate}
  <input type="hidden" {name} {value} />
{/if}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<span
  class="sui checkbox {className}"
  class:checked
  class:indeterminate
  class:disabled
  on:click|preventDefault|stopPropagation={(event) => {
    if (!(/** @type {HTMLElement} */ (event.target).matches('button'))) {
      buttonComponent.element.click();
    }
  }}
>
  <Button
    {id}
    {disabled}
    {name}
    {value}
    role="checkbox"
    aria-checked={indeterminate ? 'mixed' : checked}
    aria-labelledby="{id}-label"
    bind:this={buttonComponent}
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
  {#if $$slots.default || label}
    <label id="{id}-label">
      {#if $$slots.default}
        <slot />
      {:else}
        {label}
      {/if}
    </label>
  {/if}
</span>

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

      label {
        color: var(--disabled-foreground-color);
      }
    }

    :global(button) {
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-width: 2px;
      border-color: var(--checkbox-border-color);
      border-radius: 4px;
      width: 20px;
      height: 20px;
      color: var(--primary-accent-color-lighter);
      transition: all 200ms;

      :global(.icon) {
        font-size: 20px;
      }
    }

    :global(button[aria-checked='true']) {
      border-color: var(--primary-accent-color-lighter);
      color: var(--control-background-color);
      background-color: var(--primary-accent-color-lighter);
    }

    :global(button[aria-checked='mixed']) {
      color: var(--checkbox-border-color);
    }

    :global(button[aria-checked='false']) {
      color: transparent;
    }

    label {
      cursor: inherit;
    }
  }
</style>
