<!--
  @component
  A variant of `<Checkbox>`, looking like a switch that can be often seen on mobile apps.
  @see https://w3c.github.io/aria/#switch
  @see https://www.w3.org/WAI/ARIA/apg/patterns/switch/
-->
<script>
  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
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
   * Whether to disable the widget. An alias of the `aria-readonly` attribute.
   * @type {boolean}
   */
  export let readonly = false;
  /**
   * Whether to disable the widget. An alias of the `aria-required` attribute.
   * @type {boolean}
   */
  export let required = false;
  /**
   * Whether to disable the widget. An alias of the `aria-invalid` attribute.
   * @type {boolean}
   */
  export let invalid = false;
  /**
   * Whether to check the widget. An alias of the `aria-checked` attribute.
   * @type {boolean | 'mixed'}
   */
  export let checked = false;
  /**
   * Text label displayed next to the switch.
   * @type {string | undefined}
   */
  export let label = undefined;
</script>

<button
  class="sui switch {className}"
  type="button"
  role="switch"
  hidden={hidden || undefined}
  disabled={disabled || undefined}
  aria-checked={checked}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-readonly={readonly}
  aria-required={required}
  aria-invalid={invalid}
  {...$$restProps}
  on:click={() => {
    checked = !checked;
  }}
>
  <span />
  {#if label}
    {label}
  {:else}
    <slot />
  {/if}
</button>

<style lang="scss">
  button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
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
    text-align: left;
    cursor: pointer;
    -webkit-user-select: none;
    user-select: none;

    &:disabled {
      cursor: default;

      span {
        opacity: 0.4;
      }
    }

    &:hover {
      &[aria-checked='false'] {
        span {
          background-color: var(--sui-highlight-background-color);
        }
      }

      &[aria-checked='true'] {
        span {
          background-color: var(--sui-primary-accent-color-lighter);
        }
      }
    }

    &:active {
      &[aria-checked='false'] {
        span {
          background-color: var(--sui-active-background-color);
        }
      }

      &[aria-checked='true'] {
        span {
          background-color: var(--sui-primary-accent-color-darker);
        }
      }
    }

    &:focus-visible {
      outline: 0;

      span::before {
        outline-offset: 1px;
        outline-width: 2px;
        outline-style: solid;
        outline-color: var(--sui-primary-accent-color-lighter);
      }
    }

    &[aria-checked='true'] {
      span {
        background-color: var(--sui-primary-accent-color);
        border-color: transparent;

        &::before {
          transform: translateX(22px);
          background-color: var(--sui-primary-accent-color-foreground);
        }
      }
    }
  }

  span {
    position: relative;
    width: 42px;
    height: 20px;
    padding: 2px;
    display: inline-block;
    border-width: 1px;
    border-style: solid;
    border-color: var(--sui-control-border-color);
    border-radius: 16px;
    background-color: var(--sui-control-background-color);
    transition: all 200ms;

    &::before {
      display: inline-block;
      width: 14px;
      height: 14px;
      border-radius: 16px;
      background-color: var(--sui-primary-accent-color-foreground);
      transition: all 200ms;
      content: '';
    }
  }
</style>
