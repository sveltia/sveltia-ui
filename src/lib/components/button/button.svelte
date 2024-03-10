<!--
  @component
  A generic button widget based on the HTML `<button>` element.
  @see https://w3c.github.io/aria/#button
  @see https://www.w3.org/WAI/ARIA/apg/patterns/button/
-->
<svelte:options accessors={true} />

<script>
  import { createEventDispatcher } from 'svelte';
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
   * Make the button width flexible.
   * @type {boolean}
   */
  export let flex = false;
  /**
   * Where to show the dropdown menu.
   * @type {PopupPosition}
   */
  export let popupPosition = 'bottom-left';
  /**
   * Whether to show the backdrop for the popup.
   * @type {boolean}
   */
  export let showPopupBackdrop = false;

  const dispatch = createEventDispatcher();
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
  class:flex
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
  on:select={(/** @type {CustomEvent} */ event) => {
    dispatch('select', event.detail);
  }}
  on:change={(/** @type {CustomEvent} */ event) => {
    dispatch('change', event.detail);
  }}
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
  <Popup
    anchor={element}
    position={popupPosition}
    showBackdrop={showPopupBackdrop}
    touchOptimized={true}
    bind:this={popupComponent}
  >
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
    color: var(--sui-control-foreground-color, inherit);
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
      border-width: var(--sui-button-primary-border-width, 1px);
      border-style: var(--sui-button-primary-border-style, solid);
      border-color: var(--sui-button-primary-border-color, var(--sui-primary-accent-color));
      color: var(--sui-button-primary-foreground-color, var(--sui-primary-accent-color-inverted));
      background-color: var(--sui-button-primary-background-color, var(--sui-primary-accent-color));
      font-weight: var(--sui-button-primary-font-weight, normal);

      &:hover,
      &:focus-visible,
      &[aria-expanded='true'] {
        color: var(
          --sui-button-primary-foreground-color-focus,
          var(--sui-button-primary-foreground-color, var(--sui-primary-accent-color-inverted))
        );
        background-color: var(
          --sui-button-primary-background-color-focus,
          var(--sui-primary-accent-color-light)
        );
      }

      &:active {
        color: var(
          --sui-button-primary-foreground-color-active,
          var(--sui-button-primary-foreground-color, var(--sui-primary-accent-color-inverted))
        );
        background-color: var(
          --sui-button-primary-background-color-active,
          var(--sui-primary-accent-color-dark)
        );
      }
    }

    &:global(.secondary) {
      border-width: var(--sui-button-secondary-border-width, 1px);
      border-style: var(--sui-button-secondary-border-style, solid);
      border-color: var(--sui-button-secondary-border-color, var(--sui-primary-accent-color));
      color: var(--sui-button-secondary-foreground-color, var(--sui-primary-accent-color-text));
      background-color: var(
        --sui-button-secondary-background-color,
        var(--sui-button-background-color)
      );
      font-weight: var(--sui-button-secondary-font-weight, normal);

      &:hover,
      &:focus-visible,
      &[aria-expanded='true'] {
        color: var(
          --sui-button-secondary-foreground-color-focus,
          var(--sui-button-secondary-foreground-color, var(--sui-primary-accent-color-text))
        );
        background-color: var(
          --sui-button-secondary-background-color-focus,
          var(--sui-hover-background-color)
        );
      }

      &:active {
        color: var(
          --sui-button-secondary-foreground-color-active,
          var(--sui-button-secondary-foreground-color, var(--sui-primary-accent-color-text))
        );
        background-color: var(
          --sui-button-secondary-background-color-active,
          var(--sui-active-background-color)
        );
      }

      &[aria-pressed='true'] {
        color: var(--sui-button-secondary-foreground-color-pressed);
        background-color: var(
          --sui-button-secondary-background-color-pressed,
          var(--sui-primary-accent-color)
        );
      }
    }

    &:global(.tertiary) {
      border-width: var(--sui-button-tertiary-border-width, 1px);
      border-style: var(--sui-button-tertiary-border-style, solid);
      border-color: var(--sui-button-tertiary-border-color, var(--sui-button-border-color));
      color: var(--sui-button-tertiary-foreground-color, var(--sui-highlight-foreground-color));
      background-color: var(
        --sui-button-tertiary-background-color,
        var(--sui-button-background-color)
      );
      font-weight: var(--sui-button-tertiary-font-weight, normal);

      &:hover,
      &:focus-visible,
      &[aria-expanded='true'] {
        color: var(
          --sui-button-tertiary-foreground-color-focus,
          var(--sui-button-tertiary-foreground-color, var(--sui-highlight-foreground-color))
        );
        background-color: var(
          --sui-button-tertiary-background-color-focus,
          var(--sui-hover-background-color)
        );
      }

      &:active {
        color: var(
          --sui-button-tertiary-foreground-color-active,
          var(--sui-button-tertiary-foreground-color, var(--sui-highlight-foreground-color))
        );
        background-color: var(
          --sui-button-tertiary-background-color-active,
          var(--sui-active-background-color)
        );
      }

      &[aria-pressed='true'] {
        color: var(--sui-button-tertiary-foreground-color-pressed);
        background-color: var(
          --sui-button-tertiary-background-color-pressed,
          var(--sui-selected-background-color)
        );
      }
    }

    &:global(.ghost) {
      font-weight: var(--sui-button-ghost-font-weight, normal);

      &:hover,
      &:focus-visible,
      &[aria-expanded='true'] {
        color: var(--sui-button-ghost-foreground-color-focus);
        background-color: var(
          --sui-button-ghost-background-color-focus,
          var(--sui-hover-background-color)
        );
      }

      &:active {
        color: var(--sui-button-ghost-foreground-color-active);
        background-color: var(
          --sui-button-ghost-background-color-active,
          var(--sui-active-background-color)
        );
      }

      &[aria-pressed='true'] {
        color: var(--sui-button-ghost-foreground-color-pressed);
        background-color: var(
          --sui-button-ghost-background-color-pressed,
          var(--sui-selected-background-color)
        );
      }
    }

    &:global(.link) {
      outline: 0;
      margin: 0;
      border-radius: 0 !important;
      padding: 0 !important;
      height: auto !important;
      color: var(--sui-button-link-foreground-color, var(--sui-primary-accent-color-text));

      :global(.label) {
        padding: 0;
        line-height: var(--sui-line-height-compact);
        text-decoration: var(--sui-button-link-text-decoration, none);
        white-space: normal;
      }

      &:hover,
      &:focus,
      &:active {
        :global(.label) {
          text-decoration: var(--sui-button-link-text-decoration-focus, underline);
        }
      }
    }

    &:global(.small) {
      border-radius: var(--sui-button-small-border-radius);
      padding: var(--sui-button-small-padding);
      height: var(--sui-button-small-height);
      font-size: var(--sui-button-small-font-size, var(--sui-font-size-small));

      :global(.icon) {
        font-size: var(--sui-font-size-large);
      }
    }

    &:global(.medium) {
      border-radius: var(--sui-button-medium-border-radius);
      padding: var(--sui-button-medium-padding);
      height: var(--sui-button-medium-height);
      font-size: var(--sui-button-medium-font-size, var(--sui-font-size-default));
    }

    &:global(.large) {
      border-radius: var(--sui-button-large-border-radius);
      padding: var(--sui-button-large-padding);
      height: var(--sui-button-large-height);
      font-size: var(--sui-button-large-font-size, var(--sui-font-size-large));
    }

    &:global(.pill) {
      border-radius: 80px;
      padding: var(--sui-button-medium-pill-padding, 0 12px);
    }

    &:global(.flex) {
      width: -moz-available;
      width: -webkit-fill-available;
      width: stretch;
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
