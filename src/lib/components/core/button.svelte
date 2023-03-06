<!--
  @component
  @see https://w3c.github.io/aria/#button
  @see https://w3c.github.io/aria-practices/#button
-->
<svelte:options accessors={true} />

<script>
  import Icon from './icon.svelte';

  /**
   * CSS class name on the button.
   * @type {String}
   */
  let className = '';

  export { className as class };

  /**
   * Reference to the button element.
   * @type {(HTMLButtonElement|undefined)}
   */
  export let element = undefined;

  /**
   * The `type` attribute on the button element.
   * @type {('button'|'submit'|'reset')}
   */
  export let type = 'button';

  /**
   * The `role` attribute on the button element.
   * @type {String}
   */
  export let role = 'button';

  /**
   * The height of the button.
   * @type {('small'|'medium'|'large')}
   */
  export let size = 'medium';

  /**
   * Whether the button is hidden.
   * @type {Boolean}
   */
  export let hidden = false;

  /**
   * Whether the button is disabled.
   * @type {Boolean}
   */
  export let disabled = false;

  /**
   * The `aria-pressed` attribute on the button element.
   * @type {(Boolean|String|undefined)}
   */
  export let pressed = undefined;

  /**
   * Text label displayed on the button.
   * @type {String}
   */
  export let label = '';

  /**
   * The name of the Material Symbols icon on the button.
   */
  export let iconName = '';

  /**
   * The accessible label on the icon. It can be omitted of a visible `label` is defined.
   */
  export let iconLabel = '';

  /**
   * Where the icon is displayed.
   * @type {('start'|'end')}
   */
  export let iconPosition = 'start';
</script>

<button
  {type}
  {role}
  hidden={hidden ? 'hidden' : undefined}
  disabled={disabled ? 'disabled' : undefined}
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
  {#if iconName && iconPosition === 'start'}
    <Icon name={iconName} label={iconLabel} />
  {/if}
  {#if label}
    <span class="label">{label}</span>
  {/if}
  <slot />
  {#if iconName && iconPosition === 'end'}
    <Icon name={iconName} label={iconLabel} />
  {/if}
</button>

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

    &:global([hidden]) {
      display: none !important;
    }

    &:global([disabled]) {
      opacity: 0.4;
      cursor: default;
      pointer-events: none;
    }

    &:global(.primary),
    &:global(.secondary),
    &:global(.ternary) {
      justify-content: center;
      border-radius: var(--button--medium--border-radius);
      padding: 0 8px;
      height: var(--button--medium--height);

      :global(.label:only-child) {
        padding: 0 4px;
      }
    }

    &:global(.primary) {
      border-width: 1px;
      border-color: var(--control-border-color);
      color: var(--primary-accent-color-foreground);
      background-color: var(--primary-accent-color);

      &:hover {
        background-color: var(--primary-accent-color-lighter);
      }

      &:active {
        background-color: var(--primary-accent-color-darker);
      }
    }

    &:global(.secondary) {
      border-width: 1px;
      border-color: var(--control-border-color);
      color: var(--highlight-foreground-color);
      background-color: var(--ternary-background-color);

      &:global([aria-pressed='true']) {
        background-color: var(--primary-accent-color);
      }
    }

    &:global(.ternary) {
      color: var(--primary-foreground-color);
      padding: 0 8px;

      &:global([aria-pressed='true']) {
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
      padding: 0 4px;
      height: var(--button--small--height);
      font-size: 12px;

      :global(.icon) {
        font-size: 16px;
      }
    }

    &:global(.link) {
      color: var(--primary-accent-color-lighter);
    }

    &:global(.iconic) {
      justify-content: center;
      border-radius: 4px;
      aspect-ratio: 1 / 1;
    }

    :global(.label) {
      padding: 0 4px;
    }
  }
</style>
