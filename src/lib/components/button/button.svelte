<!--
  @component
  A generic button widget based on the HTML `<button>` element.
  @see https://w3c.github.io/aria/#button
  @see https://www.w3.org/WAI/ARIA/apg/patterns/button/
-->
<script>
  import { activateKeyShortcuts } from '../../services/events.svelte';
  import TruncatedText from '../typography/truncated-text.svelte';
  import Popup from '../util/popup.svelte';

  /**
   * @import { ButtonProps, CommonEventHandlers } from '$lib/typedefs';
   */

  /**
   * @type {ButtonProps & CommonEventHandlers & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    element = $bindable(),
    class: className = '',
    type = 'button',
    role = 'button',
    name = undefined,
    value = undefined,
    hidden = false,
    disabled = false,
    readonly = false,
    pressed = undefined,
    keyShortcuts = undefined,
    label = '',
    lines = 1,
    variant = undefined,
    size = 'medium',
    iconic = false,
    pill = false,
    flex = false,
    popupPosition = 'bottom-left',
    showPopupBackdrop = false,
    children,
    startIcon,
    endIcon,
    popup,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<button
  bind:this={element}
  {...restProps}
  class="sui button {variant} {size} {className}"
  class:iconic
  class:pill
  class:flex
  {type}
  {name}
  {value}
  {hidden}
  {disabled}
  {role}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-readonly={readonly}
  aria-pressed={pressed}
  use:activateKeyShortcuts={keyShortcuts}
>
  {@render startIcon?.()}
  {#if variant === 'link'}
    {#if label}
      <span role="none" class="label">
        <TruncatedText {lines}>
          {label}
        </TruncatedText>
      </span>
    {:else}
      <span role="none" class="label">
        {@render children?.()}
      </span>
    {/if}
  {:else}
    {#if label}
      <span role="none" class="label">
        <TruncatedText {lines}>
          {label}
        </TruncatedText>
      </span>
    {/if}
    {@render children?.()}
  {/if}
  {@render endIcon?.()}
</button>

{#if popup}
  <Popup
    anchor={element}
    position={popupPosition}
    showBackdrop={showPopupBackdrop}
    touchOptimized={true}
  >
    {@render popup()}
  </Popup>
{/if}

<style lang="scss">
  button {
    flex: none;
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
    font-weight: var(--sui-font-weight-normal, normal);
    text-align: start;
    cursor: pointer;
    transition: all 200ms;

    &[hidden] {
      display: none !important;
    }

    &:not(:disabled):focus-visible {
      z-index: 1;
    }

    &:is(.primary, .secondary, .tertiary, .ghost) {
      justify-content: center;
      border-width: 1px;

      .label:only-child {
        padding: 0 4px;
      }
    }

    &.primary {
      border-width: var(--sui-button-primary-border-width, 1px);
      border-style: var(--sui-button-primary-border-style, solid);
      border-color: var(--sui-button-primary-border-color, var(--sui-primary-accent-color));
      color: var(--sui-button-primary-foreground-color, var(--sui-primary-accent-color-inverted));
      background-color: var(--sui-button-primary-background-color, var(--sui-primary-accent-color));
      font-weight: var(--sui-button-primary-font-weight, var(--sui-font-weight-normal, normal));

      &:is(:hover, :focus-visible, [aria-expanded='true']) {
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

    &.secondary {
      border-width: var(--sui-button-secondary-border-width, 1px);
      border-style: var(--sui-button-secondary-border-style, solid);
      border-color: var(--sui-button-secondary-border-color, var(--sui-primary-accent-color));
      color: var(--sui-button-secondary-foreground-color, var(--sui-primary-accent-color-text));
      background-color: var(
        --sui-button-secondary-background-color,
        var(--sui-button-background-color)
      );
      font-weight: var(--sui-button-secondary-font-weight, var(--sui-font-weight-normal, normal));

      &:is(:hover, :focus-visible, [aria-expanded='true']) {
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

    &.tertiary {
      border-width: var(--sui-button-tertiary-border-width, 1px);
      border-style: var(--sui-button-tertiary-border-style, solid);
      border-color: var(--sui-button-tertiary-border-color, var(--sui-button-border-color));
      color: var(--sui-button-tertiary-foreground-color, var(--sui-highlight-foreground-color));
      background-color: var(
        --sui-button-tertiary-background-color,
        var(--sui-button-background-color)
      );
      font-weight: var(--sui-button-tertiary-font-weight, var(--sui-font-weight-normal, normal));

      &:is(:hover, :focus-visible, [aria-expanded='true']) {
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

    &.ghost {
      font-weight: var(--sui-button-ghost-font-weight, var(--sui-font-weight-normal, normal));

      &:is(:hover, :focus-visible, [aria-expanded='true']) {
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

    &.link {
      outline: 0;
      margin: 0;
      border-radius: 0 !important;
      padding: 0 !important;
      height: auto !important;
      color: var(--sui-button-link-foreground-color, var(--sui-primary-accent-color-text));

      .label {
        padding: 0;
        line-height: var(--sui-line-height-compact);
        text-decoration: var(--sui-button-link-text-decoration, none);
        text-underline-offset: 2px;
        white-space: normal;

        :global(:is(:root, :host)[data-underline-links='true']) & {
          text-decoration: underline;
        }
      }

      &:is(:hover, :focus, :active) {
        .label {
          text-decoration: var(--sui-button-link-text-decoration-focus, underline);
        }
      }
    }

    &.small {
      border-radius: var(--sui-button-small-border-radius);
      padding: var(--sui-button-small-padding);
      height: var(--sui-button-small-height);
      font-size: var(--sui-button-small-font-size, var(--sui-font-size-small));

      :global {
        .icon {
          font-size: var(--sui-font-size-large);
        }
      }
    }

    &.medium {
      border-radius: var(--sui-button-medium-border-radius);
      padding: var(--sui-button-medium-padding);
      height: var(--sui-button-medium-height);
      font-size: var(--sui-button-medium-font-size, var(--sui-font-size-default));
    }

    &.large {
      border-radius: var(--sui-button-large-border-radius);
      padding: var(--sui-button-large-padding);
      height: var(--sui-button-large-height);
      font-size: var(--sui-button-large-font-size, var(--sui-font-size-large));
    }

    &.pill {
      border-radius: 80px;
      padding: var(--sui-button-medium-pill-padding, 0 12px);
    }

    &.flex {
      flex: auto;
      width: -moz-available;
      width: -webkit-fill-available;
      width: stretch;
    }

    &.iconic {
      justify-content: center;
      padding: 0;
      aspect-ratio: 1 / 1;
    }

    &.danger {
      background-color: var(--sui-error-background-color);
    }

    .label {
      padding: 0 4px;
    }

    :global {
      & > * {
        pointer-events: none;
      }

      &:has([slot='start-icon'] + [slot='end-icon']) {
        gap: 0;
      }
    }
  }
</style>
