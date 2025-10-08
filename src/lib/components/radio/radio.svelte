<!--
  @component
  The equivalent of the HTML `<input type="radio">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio
  @see https://w3c.github.io/aria/#radio
  @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script>
  import Button from '../button/button.svelte';

  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] Whether to hide the widget.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [checked] Whether to check the widget. An alias of the `aria-checked`
   * attribute.
   * @property {string} [name] The `data-name` attribute on the `<button>` element.
   * @property {any} [value] The `data-value` attribute on the `<button>` element.
   * @property {string} [valueType] Data type of the `value`. Typically `string`, `number` or
   * `boolean`. Default: auto detect.
   * @property {string} [label] Text label displayed next to the checkbox.
   * @property {string} [group] The two-way bound variable to manage the state of a group of radio
   * buttons. It works in the same way as the [`<input
   * bind:group>`](https://svelte.dev/docs/svelte/bind#input-bind:group) of Svelte.
   * @property {Snippet} [children] Primary slot content.
   * @property {Snippet} [default] Default slot content.
   * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler.
   * @property {(event: CustomEvent) => void} [onSelect] Custom `Select` event handler.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    checked = false,
    class: className,
    hidden = false,
    disabled = false,
    name = undefined,
    value = undefined,
    valueType = undefined,
    label = undefined,
    group = $bindable(),
    children,
    onChange,
    onSelect,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();

  /**
   * Reference to the `<button>` element.
   * @type {HTMLButtonElement | undefined}
   */
  let buttonElement = $state();

  // Sync `checked` with `group` and `value`
  $effect(() => {
    if (typeof group === 'string') {
      if (group === value) {
        if (!checked) {
          checked = true;
        }
      } else if (checked) {
        checked = false;
      }
    }
  });
</script>

<span
  {...restProps}
  role="none"
  class="sui radio {className}"
  class:disabled
  {hidden}
  onclick={(event) => {
    if (!(/** @type {HTMLElement} */ (event.target).matches('button'))) {
      buttonElement?.click();
    }
  }}
>
  <Button
    bind:element={buttonElement}
    role="radio"
    {id}
    {hidden}
    {disabled}
    {name}
    {value}
    {valueType}
    aria-checked={checked}
    aria-labelledby="{id}-label"
    onclick={(event) => {
      event.preventDefault();

      if (disabled || checked) {
        return;
      }

      checked = true;

      if (typeof group === 'string') {
        group = value;
      }
    }}
    {onChange}
    {onSelect}
  />
  {#if children || label}
    <label id="{id}-label">
      {#if children}
        {@render children?.()}
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
    margin: var(--sui-focus-ring-width);
    color: var(--sui-control-foreground-color);
    font-family: var(--sui-control-font-family);
    font-size: var(--sui-control-font-size);
    line-height: var(--sui-control-line-height);
    cursor: pointer;
    -webkit-user-select: none;
    user-select: none;

    :global {
      &:hover {
        button {
          background-color: var(--sui-hover-background-color);

          &[aria-checked='true'] {
            border-color: var(--sui-primary-accent-color-light);
            color: var(--sui-primary-accent-color-text);

            &::before {
              background-color: var(--sui-primary-accent-color-light);
            }
          }
        }
      }

      &:active {
        button {
          background-color: var(--sui-active-background-color);

          &[aria-checked='true'] {
            border-color: var(--sui-primary-accent-color-dark);
            color: var(--sui-primary-accent-color-dark);
          }
        }
      }

      button {
        flex: none;
        justify-content: center;
        overflow: hidden;
        margin: 0 !important;
        border-width: 1.5px;
        border-color: var(--sui-checkbox-border-color);
        border-radius: var(--sui-checkbox-height);
        padding: 0;
        width: var(--sui-checkbox-height);
        height: var(--sui-checkbox-height);
        background-color: var(--sui-checkbox-background-color);
        transition: all 200ms;

        &::before {
          content: '';
          border-radius: var(--sui-checkbox-height);
          width: calc(var(--sui-checkbox-height) - 7px);
          height: calc(var(--sui-checkbox-height) - 7px);
          background-color: var(--sui-primary-accent-color);
          opacity: 0;
          transition: all 200ms;
          will-change: opacity;
        }

        &[aria-checked='true'] {
          border-color: var(--sui-primary-accent-color);

          &::before {
            opacity: 1;
          }
        }
      }
    }

    label {
      cursor: inherit;
    }
  }
</style>
