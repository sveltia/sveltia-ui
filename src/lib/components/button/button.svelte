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
   * @type {'button' | 'submit' | 'reset'}
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
   * Whether to make the widget read-only. An alias of the `aria-readonly` attribute used in certain
   * roles, including `checkbox`, `listbox`, `slider` and `textbox`.
   * @type {boolean | undefined}
   */
  export let readonly = undefined;
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
   * The style variant of the button.
   * @type {'primary' | 'secondary' | 'tertiary' | 'ghost' | 'link' | undefined}
   */
  export let variant = undefined;
  /**
   * The size of the button.
   * @type {'small' | 'medium' | 'large' | undefined}
   */
  export let size = 'medium';
  /**
   * Whether to only show an icon on the button and trim the padding.
   */
  export let iconic = false;
  /**
   * Whether to make the button rounded.
   */
  export let pill = false;
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
  class="sui button {variant ?? ''} {size} {className}"
  class:iconic
  class:pill
  {type}
  {name}
  {value}
  hidden={hidden || undefined}
  disabled={disabled || undefined}
  {role}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-readonly={readonly}
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
  on:change
>
  <slot name="start-icon" />
  {#if variant === 'link'}
    {#if label}
      <span role="none" class="label">
        {label}
      </span>
    {:else}
      <span role="none" class="label">
        <slot />
      </span>
    {/if}
  {:else}
    {#if label}
      <span role="none" class="label">
        {label}
      </span>
    {/if}
    <slot />
  {/if}
  <slot name="end-icon" />
</button>

{#if $$slots.popup}
  <Popup anchor={element} position={popupPosition} touchOptimized={true} bind:this={popupComponent}>
    <slot name="popup" />
  </Popup>
{/if}

<style lang="scss">
  button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin: var(--sui-focus-ring-width);
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

    &:global(.primary),
    &:global(.secondary),
    &:global(.tertiary),
    &:global(.ghost) {
      justify-content: center;
      border-width: 1px;

      :global(.label:only-child) {
        padding: 0 4px;
      }
    }

    &:global(.primary) {
      border-color: var(--sui-primary-accent-color);
      color: var(--sui-primary-accent-color-inverted);
      background-color: var(--sui-primary-accent-color);

      &:hover,
      &:focus-visible,
      &[aria-expanded='true'] {
        background-color: var(--sui-primary-accent-color-light);
      }

      &:active {
        background-color: var(--sui-primary-accent-color-dark);
      }
    }

    &:global(.secondary) {
      border-color: var(--sui-primary-accent-color);
      color: var(--sui-primary-accent-color-text);
      background-color: var(--sui-button-background-color);

      &:hover,
      &:focus-visible,
      &[aria-expanded='true'] {
        background-color: var(--sui-hover-background-color);
      }

      &:active {
        background-color: var(--sui-active-background-color);
      }

      &[aria-pressed='true'] {
        background-color: var(--sui-primary-accent-color);
      }
    }

    &:global(.tertiary) {
      border-color: var(--sui-button-border-color);
      color: var(--sui-highlight-foreground-color);
      background-color: var(--sui-button-background-color);

      &:hover,
      &:focus-visible,
      &[aria-expanded='true'] {
        background-color: var(--sui-hover-background-color);
      }

      &:active {
        background-color: var(--sui-active-background-color);
      }

      &[aria-pressed='true'] {
        background-color: var(--sui-selected-background-color);
      }
    }

    &:global(.ghost) {
      &:hover,
      &:focus-visible,
      &[aria-expanded='true'] {
        background-color: var(--sui-hover-background-color);
      }

      &:active {
        background-color: var(--sui-active-background-color);
      }

      &[aria-pressed='true'] {
        background-color: var(--sui-selected-background-color);
      }
    }

    &:global(.link) {
      outline: 0;
      margin: 0;
      border-radius: 0 !important;
      padding: 0 !important;
      height: auto !important;
      color: var(--sui-primary-accent-color-text);

      :global(.label) {
        padding: 0;
        line-height: var(--sui-line-height-compact);
        white-space: normal;
      }

      &:hover,
      &:focus,
      &:active {
        :global(.label) {
          text-decoration: underline;
        }
      }
    }

    &:global(.small) {
      border-radius: var(--sui-button-small-border-radius);
      padding: var(--sui-button-small-padding);
      height: var(--sui-button-small-height);
      font-size: var(--sui-font-size-small);

      :global(.icon) {
        font-size: var(--sui-font-size-large);
      }
    }

    &:global(.medium) {
      border-radius: var(--sui-button-medium-border-radius);
      padding: var(--sui-button-medium-padding);
      height: var(--sui-button-medium-height);
    }

    &:global(.large) {
      border-radius: var(--sui-button-large-border-radius);
      padding: var(--sui-button-large-padding);
      height: var(--sui-button-large-height);
      font-size: var(--sui-font-size-large);
    }

    &:global(.pill) {
      border-radius: 80px;
      padding: var(--sui-button-medium-pill-padding, 0 12px);
    }

    &:global(.iconic) {
      justify-content: center;
      padding: 0;
      aspect-ratio: 1 / 1;
    }

    &:global(.danger) {
      background-color: var(--sui-error-background-color);
    }

    :global(.label) {
      padding: 0 4px;
    }
  }
</style>
