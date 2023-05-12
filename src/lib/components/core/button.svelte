<!--
  @component
  @see https://w3c.github.io/aria/#button
  @see https://w3c.github.io/aria-practices/#button
-->
<svelte:options accessors={true} />

<script>
  import Popup from '../util/popup.svelte';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  /**
   * Reference to the button element.
   * @type {HTMLButtonElement?}
   */
  export let element = undefined;

  /**
   * The `type` attribute on the button element.
   * @type {('button'|'submit'|'reset')}
   */
  export let type = 'button';

  /**
   * The `role` attribute on the button element.
   * @type {string}
   */
  export let role = 'button';

  /**
   * The height of the button.
   * @type {('small'|'medium'|'large')}
   */
  export let size = 'medium';

  /**
   * Whether the button is hidden.
   * @type {boolean}
   */
  export let hidden = false;

  /**
   * Whether the button is disabled.
   * @type {boolean}
   */
  export let disabled = false;

  /**
   * The `aria-pressed` attribute on the button element.
   * @type {(boolean | 'false' | 'mixed' | 'true' | undefined)}
   */
  export let pressed = undefined;

  /**
   * Text label displayed on the button.
   * @type {string}
   */
  export let label = '';

  /**
   * Where to show the dropdown menu.
   * @type {PopupPosition}
   */
  export let popupPosition = 'bottom-left';

  /** @type {?Popup} */
  let popupComponent;
</script>

<button
  {type}
  {role}
  hidden={hidden ? true : undefined}
  disabled={disabled ? true : undefined}
  class="sui button {size} {className}"
  aria-hidden={hidden ? true : undefined}
  aria-disabled={disabled ? true : undefined}
  aria-pressed={pressed}
  {...$$restProps}
  on:mouseenter
  on:mouseleave
  on:click
  on:dragover
  on:dragleave
  on:dragend
  on:drop
  on:keydown
  on:keyup
  on:keypress
  bind:this={element}
>
  <slot name="start-icon" />
  {#if label}
    <span class="label">{label}</span>
  {/if}
  <slot />
  <slot name="end-icon" />
</button>

{#if $$slots.popup}
  <Popup anchor={element} position={popupPosition} bind:this={popupComponent}>
    <slot name="popup" />
  </Popup>
{/if}

<style lang="scss">
  button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border-width: 0;
    border-style: solid;
    border-color: transparent;
    padding: 0;
    color: inherit;
    background-color: transparent;
    box-shadow: none;
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: all 200ms;

    & > :global(*) {
      pointer-events: none;
    }

    &:global(:not(:disabled):focus-visible) {
      z-index: 1;
    }

    &[hidden] {
      display: none !important;
    }

    &[disabled] {
      opacity: 0.4;
      cursor: default;
      pointer-events: none;
    }

    &:global(.primary),
    &:global(.secondary),
    &:global(.tertiary),
    &:global(.ghost) {
      justify-content: center;
      border-width: 1px;
      border-radius: var(--button--medium--border-radius);
      padding: var(--button--medium--padding, 0 8px);
      height: var(--button--medium--height);

      :global(.label:only-child) {
        padding: 0 4px;
      }
    }

    &:global(.primary) {
      border-color: var(--control-border-color);
      color: var(--primary-accent-color-foreground);
      background-color: var(--primary-accent-color);

      &:hover,
      &:focus-visible {
        background-color: var(--primary-accent-color-lighter);
      }

      &:active {
        background-color: var(--primary-accent-color-darker);
      }
    }

    &:global(.secondary) {
      border-color: var(--primary-accent-color);
      color: var(--primary-accent-color-lighter);
      background-color: var(--tertiary-background-color);

      &:hover,
      &:focus-visible {
        background-color: var(--highlight-background-color);
      }

      &[aria-pressed='true'] {
        background-color: var(--primary-accent-color);
      }
    }

    &:global(.tertiary) {
      border-color: var(--control-border-color);
      color: var(--highlight-foreground-color);
      background-color: var(--tertiary-background-color);

      &:hover,
      &:focus-visible {
        background-color: var(--highlight-background-color);
      }

      &[aria-pressed='true'] {
        background-color: var(--highlight-background-color);
      }
    }

    &:global(.ghost) {
      &:hover,
      &:focus-visible {
        background-color: var(--highlight-background-color);
      }

      &[aria-pressed='true'] {
        background-color: var(--highlight-background-color);
      }
    }

    &:global(.danger) {
      background-color: var(--danger-background-color);
    }

    &:global(.large) {
      height: var(--button--large--height);
    }

    &:global(.small) {
      padding: var(--button--small--padding, 0 8px);
      height: var(--button--small--height);
      font-size: var(--font-size--small);

      :global(.icon) {
        font-size: var(--font-size--large);
      }
    }

    &:global(.pill) {
      border-radius: var(--button--medium--pill--height, 16px);
      padding: var(--button--medium--pill--padding, 0 16px);
    }

    &:global(.link) {
      color: var(--primary-accent-color-lighter);
    }

    &:global(.iconic) {
      justify-content: center;
      padding: 0;
      border-radius: 4px;
      aspect-ratio: 1 / 1;
    }

    :global(.label) {
      padding: 0 4px;
    }
  }
</style>
