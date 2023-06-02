<!--
  @component
  @see https://w3c.github.io/aria/#radio
  @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script>
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

  /** @type {string?} */
  export let value = undefined;

  /** @type {boolean} */
  export let selected = false;

  const id = getRandomId('checkbox');
  /** @type {Button} */
  let buttonComponent;
</script>

{#if name && value && selected}
  <input type="hidden" {name} {value} />
{/if}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<span
  class="sui radio-button {className}"
  on:click={(event) => {
    if (!(/** @type {HTMLElement} */ (event.target).matches('button'))) {
      buttonComponent.element.click();
    }
  }}
>
  <Button
    {id}
    role="radio"
    aria-checked={selected}
    aria-labelledby="{id}-label"
    bind:this={buttonComponent}
    on:click={(event) => {
      event.preventDefault();
      selected = !selected;
    }}
  >
    <Icon slot="start-icon" name="circle" />
  </Button>
  <label id="{id}-label">
    <slot />
  </label>
</span>

<style lang="scss">
  .radio-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: inherit;
    cursor: pointer;
    -webkit-user-select: none;
    user-select: none;

    :global(button) {
      justify-content: center;
      overflow: hidden;
      border-width: 2px;
      border-color: var(--control-border-color);
      border-radius: 24px;
      width: 24px;
      height: 24px;
      color: var(--primary-accent-color-lighter);
      transition: all 200ms;

      :global(.icon) {
        font-size: var(--font-size--large);
        font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48;
      }
    }

    :global(button[aria-checked='true']) {
      color: var(--primary-accent-color-lighter);
    }

    :global(button[aria-checked='false']) {
      color: transparent;
    }
  }
</style>
