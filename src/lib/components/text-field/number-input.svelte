<!--
  @component
  The equivalent of the HTML `<input type="number">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number
  @see https://w3c.github.io/aria/#textbox
-->
<script>
  import { untrack } from 'svelte';
  import { _ } from 'svelte-i18n';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import TextInput from './text-input.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { CommonEventHandlers, InputEventHandlers, TextInputProps } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {number} [value] Input value.
   * @property {number} [min] Minimum allowed value.
   * @property {number} [max] Maximum allowed value.
   * @property {number} [step] Value to be added or removed when using the up/down arrow key or
   * button.
   * @property {Snippet} [increaseIcon] Increase icon slot content.
   * @property {Snippet} [decreaseIcon] Decrease icon slot content.
   */

  /**
   * @type {TextInputProps & CommonEventHandlers & InputEventHandlers & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    value = $bindable(),
    invalid = $bindable(false),
    flex = false,
    min = undefined,
    max = undefined,
    step = 1,
    class: className,
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    children,
    increaseIcon,
    decreaseIcon,
    onChange,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();

  let edited = $state(false);
  let inputValue = $state('');

  const maximumFractionDigits = $derived(String(step).split('.')[1]?.length || 0);
  const isMin = $derived(typeof min === 'number' && Number(inputValue || 0) <= min);
  const isMax = $derived(typeof max === 'number' && Number(inputValue || 0) >= max);

  $effect(() => {
    const newInputValue = String(value ?? '');

    untrack(() => {
      if (inputValue !== newInputValue) {
        inputValue = newInputValue;
      }
    });
  });

  $effect(() => {
    const newValue = inputValue.trim() ? Number(inputValue) : NaN;

    value = !Number.isNaN(newValue) ? newValue : undefined;
  });

  $effect(() => {
    if (edited) {
      invalid =
        (required && (value === undefined || inputValue === '')) ||
        (inputValue !== undefined &&
          inputValue !== '' &&
          (Number.isNaN(Number(inputValue)) ||
            (typeof min === 'number' && Number(inputValue || 0) < min) ||
            (typeof max === 'number' && Number(inputValue || 0) > max)));
    }
  });

  /**
   * Decrease the number.
   */
  const decrease = () => {
    if (isMin || Number.isNaN(Number(inputValue))) {
      return;
    }

    inputValue = Number(Number(inputValue || 0) - step).toFixed(maximumFractionDigits);
  };

  /**
   * Increase the number.
   */
  const increase = () => {
    if (isMax || Number.isNaN(Number(inputValue))) {
      return;
    }

    inputValue = Number(Number(inputValue || 0) + step).toFixed(maximumFractionDigits);
  };
</script>

<div
  role="none"
  class="sui number-input {className}"
  class:flex
  class:disabled
  class:readonly
  {hidden}
>
  <div role="none" class="buttons">
    <Button
      iconic
      disabled={disabled || readonly || Number.isNaN(Number(value)) || isMax}
      aria-label={$_('_sui.number_input.increase')}
      aria-controls={id}
      onclick={() => {
        increase();
      }}
    >
      {#snippet startIcon()}
        {#if increaseIcon}
          {@render increaseIcon()}
        {:else}
          <Icon name="expand_less" />
        {/if}
      {/snippet}
    </Button>
    <Button
      iconic
      disabled={disabled || readonly || Number.isNaN(Number(value)) || isMin}
      aria-label={$_('_sui.number_input.decrease')}
      aria-controls={id}
      onclick={() => {
        decrease();
      }}
    >
      {#snippet startIcon()}
        {#if decreaseIcon}
          {@render decreaseIcon()}
        {:else}
          <Icon name="expand_more" />
        {/if}
      {/snippet}
    </Button>
  </div>
  <TextInput
    {...restProps}
    role="spinbutton"
    {id}
    bind:value={inputValue}
    spellcheck="false"
    {flex}
    {hidden}
    {disabled}
    {readonly}
    {required}
    {invalid}
    aria-valuenow={Number(value || 0)}
    aria-valuemin={min}
    aria-valuemax={max}
    inputmode={maximumFractionDigits > 0 ? 'decimal' : 'numeric'}
    onkeydown={(event) => {
      const { key, ctrlKey, metaKey, altKey, shiftKey } = event;
      const hasModifier = shiftKey || altKey || ctrlKey || metaKey;

      if (key === 'ArrowDown' && !hasModifier) {
        event.preventDefault();
        decrease();
      }

      if (key === 'ArrowUp' && !hasModifier) {
        event.preventDefault();
        increase();
      }

      if (!edited) {
        edited = true;
      }
    }}
    oninput={() => {
      if (!edited) {
        edited = true;
      }
    }}
    {onChange}
  />
</div>

<style lang="scss">
  .number-input {
    display: inline-flex;
    align-items: center;
    margin: var(--sui-focus-ring-width);
    min-width: var(--sui-textbox-singleline-min-width);

    &.flex {
      width: -moz-available;
      width: -webkit-fill-available;
      width: stretch;
      min-width: 0;
    }

    :global {
      :not(:first-child) input {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }

      :not(:last-child) input {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }

      // Maintain the border opacity
      &:not(.disabled) {
        button[aria-disabled='true'] {
          filter: grayscale(0) opacity(1);

          * {
            filter: grayscale(1) opacity(0.35);
          }
        }
      }

      .text-input {
        flex: auto;
        margin: 0 !important;
        width: 0; // = auto
        min-width: 0 !important;
      }
    }
  }

  .buttons {
    display: flex;
    flex-direction: column;
    width: 24px;
    height: var(--sui-textbox-height);

    :global {
      button {
        flex: none;
        margin: 0 !important;
        border-width: 1px;
        border-color: var(--sui-textbox-border-color);
        width: 100%;
        height: 50%;

        &:first-of-type {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
          border-bottom-left-radius: 0;
          border-width: 1px 0 0 1px;
        }

        &:last-of-type {
          border-top-left-radius: 0;
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
          border-width: 0 0 1px 1px;
        }

        .icon {
          font-size: 20px;
        }
      }
    }
  }
</style>
