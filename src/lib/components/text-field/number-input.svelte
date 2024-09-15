<!--
  @component
  The equivalent of the HTML `<input type="number">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number
  @see https://w3c.github.io/aria/#textbox
-->
<script>
  import { generateElementId } from '@sveltia/utils/element';
  import { _ } from 'svelte-i18n';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import TextInput from './text-input.svelte';

  /**
   * @typedef {object} Props
   * @property {number | undefined} [min] - Minimum allowed value.
   * @property {number | undefined} [max] - Maximum allowed value.
   * @property {number} [step] - Value to be added or removed when using the up/down arrow key or
   * button.
   * @property {import('svelte').Snippet} [increaseIcon] - Increase icon slot content.
   * @property {import('svelte').Snippet} [decreaseIcon] - Decrease icon slot content.
   */

  /**
   * @type {import('$lib/typedefs').TextInputProps & import('$lib/typedefs').CommonEventHandlers &
   * import('$lib/typedefs').InputEventHandlers & Props & Record<string, any>}
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

  const id = generateElementId('input');
  let edited = $state(false);

  const maximumFractionDigits = $derived(String(step).split('.')[1]?.length || 0);
  const isMin = $derived(typeof min === 'number' && Number(value || 0) <= min);
  const isMax = $derived(typeof max === 'number' && Number(value || 0) >= max);

  $effect(() => {
    invalid =
      (required && edited && (value === undefined || value === '')) ||
      (value !== undefined &&
        value !== '' &&
        (Number.isNaN(Number(value)) ||
          (typeof min === 'number' && Number(value || 0) < min) ||
          (typeof max === 'number' && Number(value || 0) > max)));
  });

  /**
   * Decrease the number.
   */
  const decrease = () => {
    if (isMin) {
      return;
    }

    value = Number(Number(value || 0) - step).toFixed(maximumFractionDigits);
  };

  /**
   * Increase the number.
   */
  const increase = () => {
    if (isMax) {
      return;
    }

    value = Number(Number(value || 0) + step).toFixed(maximumFractionDigits);
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
    bind:value
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

    :global(:not(:first-child) input) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }

    :global(:not(:last-child) input) {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }

    // Maintain the border opacity
    &:not(.disabled) {
      :global(button[aria-disabled='true']) {
        filter: grayscale(0) opacity(1);

        :global(*) {
          filter: grayscale(1) opacity(0.35);
        }
      }
    }

    :global(.text-input) {
      flex: auto;
      margin: 0 !important;
      width: 0; // = auto
      min-width: 0 !important;
    }
  }

  .buttons {
    display: flex;
    flex-direction: column;
    width: 24px;
    height: var(--sui-textbox-height);

    :global(button) {
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

      :global(.icon) {
        font-size: 20px;
      }
    }
  }
</style>
