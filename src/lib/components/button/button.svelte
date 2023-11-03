<!--
  @component
  A generic button widget based on the HTML `<button>` element.
  @see https://w3c.github.io/aria/#button
  @see https://www.w3.org/WAI/ARIA/apg/patterns/button/
-->
<svelte:options accessors={true} />

<script>
  import { activateKeyShortcuts } from '../../services/events';
  import Popup from '../util/popup.svelte';

  /**
   * Reference to the `<button>` element.
   * @type {HTMLButtonElement | undefined}
   */
  export let element = undefined;
  /**
   * The `class` attribute on the `<button>` element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * The `type` attribute on the `<button>` element.
   * @type {('button'|'submit'|'reset')}
   */
  export let type = 'button';
  /**
   * The `role` attribute on the `<button>` element.
   * @type {string}
   */
  export let role = 'button';
  /**
   * The `name` attribute on the `<button>` element.
   * @type {string | undefined}
   */
  export let name = undefined;
  /**
   * The `value` attribute on the `<button>` element.
   * @type {string | undefined}
   */
  export let value = undefined;
  /**
   * Whether to hide the widget. An alias of the `aria-hidden` attribute.
   * @type {boolean | undefined}
   */
  export let hidden = undefined;
  /**
   * Whether to disable the widget. An alias of the `aria-disabled` attribute.
   * @type {boolean}
   */
  export let disabled = false;
  /**
   * Whether to mark the widget pressed. An alias of the `aria-pressed` attribute.
   * @type {boolean | 'mixed' | undefined}
   */
  export let pressed = undefined;
  /**
   * Keyboard shortcuts. An alias of the `aria-keyshortcuts` attribute. Accepts the special `Accel`
   * key, which will be replaced with `Control` or `Meta` depending on the user’s operating system.
   * @type {string | undefined}
   */
  export let keyShortcuts = undefined;
  /**
   * Text label displayed on the button.
   * @type {string}
   */
  export let label = '';
  /**
   * The height of the button.
   * @type {('small'|'medium'|'large')}
   */
  export let size = 'medium';
  /**
   * Where to show the dropdown menu.
   * @type {PopupPosition}
   */
  export let popupPosition = 'bottom-left';

  /**
   * Reference to the `Popup` component.
   * @type {Popup | undefined}
   */
  let popupComponent = undefined;
</script>

<button
  class="sui button {size} {className}"
  {type}
  {name}
  {value}
  hidden={hidden || undefined}
  disabled={disabled || undefined}
  {role}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-pressed={pressed}
  {...$$restProps}
  bind:this={element}
  use:activateKeyShortcuts={keyShortcuts}
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
  on:select
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
    color: var(--sui-control-foreground-color);
    background-color: transparent;
    box-shadow: none;
    font-family: var(--sui-control-font-family);
    font-size: var(--sui-control-font-size);
    line-height: var(--sui-control-line-height);
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
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
      border-radius: var(--sui-button-medium-border-radius);
      padding: var(--sui-button-medium-padding, 0 8px);
      height: var(--sui-button-medium-height);

      :global(.label:only-child) {
        padding: 0 4px;
      }
    }

    &:global(.primary) {
      border-color: var(--sui-control-border-color);
      color: var(--sui-primary-accent-color-foreground);
      background-color: var(--sui-primary-accent-color);

      &:hover,
      &:focus-visible,
      &[aria-expanded='true'] {
        background-color: var(--sui-primary-accent-color-lighter);
      }

      &:active {
        background-color: var(--sui-primary-accent-color-darker);
      }
    }

    &:global(.secondary) {
      border-color: var(--sui-primary-accent-color);
      color: var(--sui-primary-accent-color-lighter);
      background-color: var(--sui-tertiary-background-color);

      &:hover,
      &:focus-visible,
      &[aria-expanded='true'] {
        background-color: var(--sui-highlight-background-color);
      }

      &[aria-pressed='true'] {
        background-color: var(--sui-primary-accent-color);
      }
    }

    &:global(.tertiary) {
      border-color: var(--sui-control-border-color);
      color: var(--sui-highlight-foreground-color);
      background-color: var(--sui-tertiary-background-color);

      &:hover,
      &:focus-visible,
      &[aria-expanded='true'] {
        background-color: var(--sui-highlight-background-color);
      }

      &[aria-pressed='true'] {
        background-color: var(--sui-highlight-background-color);
      }
    }

    &:global(.ghost) {
      &:hover,
      &:focus-visible,
      &[aria-expanded='true'] {
        background-color: var(--sui-highlight-background-color);
      }

      &[aria-pressed='true'] {
        background-color: var(--sui-highlight-background-color);
      }
    }

    &:global(.danger) {
      background-color: var(--sui-error-background-color);
    }

    &:global(.large) {
      height: var(--sui-button-large-height);
    }

    &:global(.small) {
      padding: var(--sui-button-small-padding, 0 8px);
      height: var(--sui-button-small-height);
      font-size: var(--sui-font-size-small);

      :global(.icon) {
        font-size: var(--sui-font-size-large);
      }
    }

    &:global(.pill) {
      border-radius: var(--sui-button-medium-pill-height, 16px);
      padding: var(--sui-button-medium-pill-padding, 0 16px);
    }

    &:global(.link) {
      color: var(--sui-primary-accent-color-lighter);
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
