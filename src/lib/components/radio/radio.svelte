<!--
  @component
  The equivalent of the HTML `<input type="radio">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio
  @see https://w3c.github.io/aria/#radio
  @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script>
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

  /** @type {boolean} */
  export let selected = false;

  /** @type {boolean} */
  export let disabled = false;

  const id = getRandomId('checkbox');
  /** @type {Button} */
  let buttonComponent;
</script>

{#if name && value && selected}
  <input type="hidden" {name} {value} />
{/if}

<span
  class="sui radio {className}"
  role="none"
  on:click={(event) => {
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
    role="radio"
    aria-checked={selected}
    aria-labelledby="{id}-label"
    bind:this={buttonComponent}
    on:click={(event) => {
      event.preventDefault();
      selected = true;
    }}
  >
    <Icon slot="start-icon" name="circle" />
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
  .radio {
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
      justify-content: center;
      overflow: hidden;
      border-width: 2px;
      border-color: var(--checkbox-border-color);
      border-radius: 24px;
      width: 20px;
      height: 20px;
      color: var(--primary-accent-color-lighter);
      transition: all 200ms;

      :global(.icon) {
        font-size: 14px;
        font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48;
      }
    }

    :global(button[aria-checked='true']) {
      border-color: var(--primary-accent-color-lighter);
      color: var(--primary-accent-color-lighter);
    }

    :global(button[aria-checked='false']) {
      color: transparent;
    }

    label {
      cursor: inherit;
    }
  }
</style>
