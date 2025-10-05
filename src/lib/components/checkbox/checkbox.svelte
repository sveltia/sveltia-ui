<!--
  @component
  The equivalent of the HTML `<input type="checkbox">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox
  @see https://w3c.github.io/aria/#checkbox
  @see https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
-->
<script>
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { ButtonProps, CommonEventHandlers } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {boolean} [required] Whether to mark the widget required. An alias of the
   * `aria-required` attribute.
   * @property {boolean} [invalid] Whether to mark the widget invalid. An alias of the
   * `aria-invalid` attribute.
   * @property {boolean | 'mixed'} [checked] Whether to check the widget. An alias of the
   * `aria-checked` attribute.
   * @property {string} [label] Text label displayed next to the checkbox.
   * @property {string} [aria-label] `aria-label` attribute.
   * @property {Snippet} [checkIcon] Check icon slot content.
   * @property {string[]} [group] The two-way bound variable to manage the state of a group of
   * checkboxes. It works in the same way as the [`<input
   * bind:group>`](https://svelte.dev/docs/svelte/bind#input-bind:group) of Svelte.
   */

  /**
   * @type {ButtonProps & CommonEventHandlers & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    checked = $bindable(),
    class: className,
    name = undefined,
    value = undefined,
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    label = undefined,
    'aria-label': ariaLabel,
    group = $bindable([]),
    onChange,
    children,
    checkIcon,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();

  /**
   * Reference to the `<button>` element.
   * @type {HTMLButtonElement | undefined}
   */
  let buttonElement = $state();

  const indeterminate = $derived(checked === 'mixed');

  // Sync `checked` with `group` and `value`
  $effect(() => {
    if (group.includes(value)) {
      if (checked !== true) {
        checked = true;
      }
    } else if (checked !== false) {
      checked = false;
    }
  });
</script>

<div
  role="none"
  class="sui checkbox {className}"
  class:checked
  class:indeterminate
  class:disabled
  class:readonly
  {hidden}
  onclick={(event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!(/** @type {HTMLElement} */ (event.target).matches('button'))) {
      buttonElement?.click();
    }
  }}
>
  <div role="none" class="inner" inert={disabled}>
    <Button
      {...restProps}
      bind:element={buttonElement}
      role="checkbox"
      {id}
      {name}
      {value}
      {hidden}
      {disabled}
      {readonly}
      {required}
      aria-invalid={invalid}
      aria-checked={checked}
      aria-label={ariaLabel || undefined}
      aria-labelledby={ariaLabel ? undefined : `${id}-label`}
      onclick={(event) => {
        event.preventDefault();
        event.stopPropagation();

        if (disabled || readonly) {
          return;
        }

        checked = indeterminate ? true : !checked;
        onChange?.(new CustomEvent('Change', { detail: { checked } }));

        if (checked) {
          if (!group.includes(value)) {
            group = [...group, value];
          }
        } else if (group.includes(value)) {
          group = group.filter((v) => v !== value);
        }
      }}
    >
      {#snippet startIcon()}
        {#if checkIcon}
          {@render checkIcon()}
        {:else if indeterminate}
          <Icon name="remove" />
        {:else if checked}
          <Icon name="check" />
        {/if}
      {/snippet}
    </Button>
    {#if children || label}
      <label id="{id}-label">
        {#if children}
          {@render children()}
        {:else}
          {label}
        {/if}
      </label>
    {/if}
  </div>
</div>

<style lang="scss">
  .checkbox {
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

    &:hover {
      :global {
        button {
          background-color: var(--sui-hover-background-color);

          &[aria-checked='true'] {
            background-color: var(--sui-primary-accent-color-light);
          }
        }
      }
    }

    &:active {
      :global {
        button {
          background-color: var(--sui-active-background-color);

          &[aria-checked='true'] {
            background-color: var(--sui-primary-accent-color-dark);
          }
        }
      }
    }

    :global {
      button {
        flex: none;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        margin: 0 !important;
        border-width: var(--sui-checkbox-border-width, 1.5px);
        border-color: var(--sui-checkbox-border-color);
        border-radius: var(--sui-checkbox-border-radius);
        padding: 0;
        width: var(--sui-checkbox-height);
        height: var(--sui-checkbox-height);
        color: var(--sui-primary-accent-text-color);
        background-color: var(--sui-checkbox-background-color);
        transition: all 200ms;

        &[aria-checked='true'] {
          border-color: var(--sui-checkbox-border-color-checked, var(--sui-primary-accent-color));
          color: var(
            --sui-checkbox-foreground-color-checked,
            var(--sui-primary-accent-color-inverted)
          );
          background-color: var(
            --sui-checkbox-background-color-checked,
            var(--sui-primary-accent-color)
          );
        }

        &[aria-invalid='true'] {
          border-color: var(--sui-error-border-color);
          color: var(--sui-error-foreground-color);
        }

        &[aria-checked='true'][aria-invalid='true'] {
          background-color: var(--sui-checkbox-background-color);
        }

        .icon {
          font-size: calc(var(--sui-checkbox-height) - 2px);
        }
      }
    }

    label {
      cursor: inherit;
    }
  }

  .inner {
    display: contents;
  }
</style>
