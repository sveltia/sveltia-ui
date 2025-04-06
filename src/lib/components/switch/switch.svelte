<!--
  @component
  A variant of `<Checkbox>`, looking like a switch that can be often seen on mobile apps.
  @see https://w3c.github.io/aria/#switch
  @see https://www.w3.org/WAI/ARIA/apg/patterns/switch/
-->
<script>
  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {string} [label] Text label displayed next to the switch.
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] Whether to hide the widget.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [readonly] Whether to make the widget read-only. An alias of the
   * `aria-readonly` attribute.
   * @property {boolean} [required] Whether to mark the widget required. An alias of the
   * `aria-required` attribute.
   * @property {boolean} [invalid] Whether to mark the widget invalid. An alias of the
   * `aria-invalid` attribute.
   * @property {Snippet} [children] Primary slot content.
   * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    checked = $bindable(false),
    label = undefined,
    class: className,
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    children,
    onChange,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<button
  {...restProps}
  role="switch"
  class="sui switch {className}"
  type="button"
  {hidden}
  disabled={disabled || undefined}
  aria-checked={checked}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-readonly={readonly}
  aria-required={required}
  aria-invalid={invalid}
  onclick={() => {
    if (!disabled && !readonly) {
      checked = !checked;
      onChange?.(new CustomEvent('Change', { detail: { checked } }));
    }
  }}
>
  <span role="none"></span>
  {#if label}
    {label}
  {:else}
    {@render children?.()}
  {/if}
</button>

<style lang="scss">
  button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
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
    font-weight: var(--sui-font-weight-normal, normal);
    text-align: start;
    cursor: pointer;
    -webkit-user-select: none;
    user-select: none;

    &[aria-invalid='true'] {
      span {
        background-color: var(--sui-error-border-color) !important;
      }
    }

    &:hover {
      &[aria-checked='false'] {
        span {
          background-color: var(--sui-hover-background-color);
        }
      }

      &[aria-checked='true'] {
        span {
          background-color: var(--sui-primary-accent-color-light);
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
          background-color: var(--sui-primary-accent-color-dark);
        }
      }
    }

    &:focus-visible {
      outline: 0;

      span {
        outline-color: var(--sui-primary-accent-color-translucent);
      }
    }

    &[aria-checked='true'] {
      span {
        background-color: var(--sui-primary-accent-color);
        border-color: transparent;

        &::before {
          transform: translateX(calc(var(--sui-checkbox-height) * 2 - var(--sui-checkbox-height)));
          border-color: var(--sui-primary-accent-color);
          background-color: var(--sui-primary-accent-color-inverted);
        }
      }
    }
  }

  span {
    position: relative;
    width: calc(var(--sui-checkbox-height) * 2);
    height: var(--sui-checkbox-height);
    padding: 0 2px;
    display: inline-flex;
    align-items: center;
    border-width: 1.5px;
    border-style: solid;
    border-color: var(--sui-checkbox-border-color);
    border-radius: var(--sui-checkbox-height);
    background-color: var(--sui-control-background-color);
    transition: all 200ms;

    &::before {
      display: inline-block;
      width: calc(var(--sui-checkbox-height) - 6px);
      height: calc(var(--sui-checkbox-height) - 6px);
      border-radius: var(--sui-checkbox-height);
      background-color: var(--sui-checkbox-border-color);
      transition: all 200ms;
      content: '';
    }
  }
</style>
