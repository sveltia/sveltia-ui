<!--
  @component
  The equivalent of the HTML `<input type="number">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number
  @see https://w3c.github.io/aria/#textbox
-->
<script>
  import { _, locale } from '@sveltia/i18n';
  import { untrack } from 'svelte';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import {
    STEP_DISABLED,
    getInputMode,
    getMaximumFractionDigits,
    isAtMax,
    isAtMin,
    isInvalidNumber,
    normalizeNumber,
    normalizeStep,
    parseNumber,
    stepNumber,
  } from './number-input.js';
  import TextInput from './text-input.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { CommonEventHandlers, InputEventHandlers, TextInputProps } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {number} [value] Input value.
   * @property {number} [min] Minimum allowed value.
   * @property {number} [max] Maximum allowed value.
   * @property {number} [step] Value to be added or removed when using the up/down arrow key or
   * button. Set to `-1` to hide the buttons and disable stepping with the arrow keys, for a number
   * that isn’t meant to be stepped, like an ID. Any other value that isn’t a positive number falls
   * back to `1`.
   * @property {boolean} [fractional] Whether the number can have a fraction, which brings up the
   * decimal keypad rather than the numeric one on mobile. If omitted, it’s inferred from `step`:
   * `true` for a fractional step or with stepping turned off, `false` for an integer step.
   * @property {'text' | 'decimal' | 'numeric'} [inputmode] The `inputmode` attribute on the
   * `<input>`. If omitted, it’s `text` if a negative number is allowed, as the numeric and decimal
   * keypads on iOS have no minus key, otherwise `decimal` or `numeric` depending on `fractional`.
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
    fractional = undefined,
    inputmode = undefined,
    class: className,
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    children,
    increaseIcon,
    decreaseIcon,
    onChange,
    onkeydown,
    oninput,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();

  let edited = $state(false);
  let inputValue = $state('');

  // `-1` turns stepping off altogether, leaving a plain text box: a spin button promises the arrow
  // keys step the value
  const stepEnabled = $derived(step !== STEP_DISABLED);
  const stepSize = $derived(normalizeStep(step));
  const isFractional = $derived(
    fractional ?? (!stepEnabled || getMaximumFractionDigits(stepSize) > 0),
  );
  // A plain text box can’t expose the range with `aria-valuemin` and `aria-valuemax`, so it’s
  // described instead, by a hidden element: `aria-description` isn’t supported everywhere
  const rangeDescription = $derived.by(() => {
    const hasMin = typeof min === 'number';
    const hasMax = typeof max === 'number';

    if (stepEnabled || (!hasMin && !hasMax)) {
      return undefined;
    }

    if (hasMin && hasMax) {
      return _('_sui.number_input.range', { values: { min, max } });
    }

    return hasMin
      ? _('_sui.number_input.min', { values: { min } })
      : _('_sui.number_input.max', { values: { max } });
  });
  const describedBy = $derived(
    [restProps['aria-describedby'], rangeDescription ? `${id}-range` : undefined]
      .filter(Boolean)
      .join(' ') || undefined,
  );
  // Accept the decimal separator of the field’s language, or that of the UI, like `,` in German
  const numberValue = $derived(normalizeNumber(inputValue, restProps.lang ?? locale.current));
  const isMin = $derived(isAtMin(numberValue, min));
  const isMax = $derived(isAtMax(numberValue, max));

  $effect(() => {
    const newValue = value;

    // Only overwrite the field when it doesn’t already hold the value, so text that is still being
    // typed, like `1.` or `-`, isn’t wiped out when it parses to the same number or no number
    untrack(() => {
      if (parseNumber(numberValue) !== newValue) {
        inputValue = String(newValue ?? '');
      }
    });
  });

  $effect(() => {
    value = parseNumber(numberValue);
  });

  $effect(() => {
    if (edited) {
      invalid = isInvalidNumber(numberValue, { required, min, max });
    }
  });

  /**
   * Step the number up or down, unless the field holds no number or is already at the limit.
   * @param {1 | -1} direction `1` to increase, `-1` to decrease.
   */
  const stepValue = (direction) => {
    const newInputValue = stepNumber(numberValue, { step: stepSize, direction, min, max });

    if (newInputValue !== undefined) {
      inputValue = newInputValue;
    }
  };

  /**
   * Decrease the number.
   */
  const decrease = () => {
    stepValue(-1);
  };

  /**
   * Increase the number.
   */
  const increase = () => {
    stepValue(1);
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
  {#if stepEnabled}
    <div role="none" class="buttons">
      <Button
        iconic
        disabled={disabled || readonly || Number.isNaN(Number(numberValue)) || isMax}
        aria-label={_('_sui.number_input.increase')}
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
        disabled={disabled || readonly || Number.isNaN(Number(numberValue)) || isMin}
        aria-label={_('_sui.number_input.decrease')}
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
  {:else if rangeDescription}
    <span id="{id}-range" hidden>{rangeDescription}</span>
  {/if}
  <TextInput
    dir="ltr"
    {...restProps}
    role={stepEnabled ? 'spinbutton' : 'textbox'}
    {id}
    bind:value={inputValue}
    spellcheck="false"
    {flex}
    {hidden}
    {disabled}
    {readonly}
    {required}
    {invalid}
    aria-valuenow={stepEnabled && Number.isFinite(value) ? value : undefined}
    aria-valuemin={stepEnabled ? min : undefined}
    aria-valuemax={stepEnabled ? max : undefined}
    inputmode={inputmode ?? getInputMode({ fractional: isFractional, min })}
    aria-describedby={describedBy}
    onkeydown={(event) => {
      const { key, ctrlKey, metaKey, altKey, shiftKey } = event;
      const hasModifier = shiftKey || altKey || ctrlKey || metaKey;
      // A read-only field can’t be stepped, just like the spin buttons
      const canStep = stepEnabled && !disabled && !readonly && !hasModifier;

      if (key === 'ArrowDown' && canStep) {
        event.preventDefault();
        decrease();
      }

      if (key === 'ArrowUp' && canStep) {
        event.preventDefault();
        increase();
      }

      if (!edited) {
        edited = true;
      }

      onkeydown?.(event);
    }}
    oninput={(event) => {
      if (!edited) {
        edited = true;
      }

      oninput?.(event);
    }}
    {onChange}
  />
</div>

<style lang="scss">
  @use '../../styles/mixins';

  .number-input {
    display: inline-flex;
    align-items: center;
    margin: var(--sui-focus-ring-width);
    min-width: var(--sui-textbox-singleline-min-width);

    @include mixins.flex-stretch;

    // Maintain the border opacity
    &:not(.disabled) :global(button[aria-disabled='true']) {
      filter: grayscale(0) opacity(1);

      :global(*) {
        filter: grayscale(1) opacity(var(--sui-disabled-opacity, 0.35));
      }
    }

    :global {
      // Square off the start corners next to the spin buttons, but not next to the hidden range
      // description, which is there with stepping turned off
      .buttons + * input {
        border-start-start-radius: 0;
        border-end-start-radius: 0;
      }

      :not(:last-child) input {
        border-start-end-radius: 0;
        border-end-end-radius: 0;
      }

      @include mixins.embedded-text-input;
    }
  }

  // The spin buttons sit side by side, each the full height of the field: stacked in a 32px field
  // they’d be 16px tall, well under the 24px pointer target minimum (WCAG 2.5.8)
  .buttons {
    display: flex;
    flex-direction: row;
    width: 48px;
    height: var(--sui-textbox-height);

    :global {
      button {
        flex: none;
        margin: 0 !important;
        border-width: 1px;
        border-color: var(--sui-textbox-border-color);
        width: 50%;
        height: 100%;
        border-inline-end-width: 0;

        &:first-of-type {
          border-start-end-radius: 0;
          border-end-end-radius: 0;
        }

        &:last-of-type {
          border-radius: 0;
        }

        .icon {
          font-size: 20px;
        }
      }
    }
  }
</style>
