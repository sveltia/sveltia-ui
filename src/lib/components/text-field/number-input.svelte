<!--
  @component
  The equivalent of the HTML `<input type="number">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number
  @see https://w3c.github.io/aria/#textbox
-->
<script>
  import { _ } from 'svelte-i18n';
  import { getRandomId } from '$lib/services/util';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import TextInput from './text-input.svelte';

  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * Make the text input container flexible.
   * @type {boolean}
   */
  export let flex = false;
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
   * Whether to disable the widget. An alias of `aria-readonly` attribute.
   * @type {boolean}
   */
  export let readonly = false;
  /**
   * Whether to mark the widget required. An alias of the `aria-required` attribute.
   * @type {boolean}
   */
  export let required = false;
  /**
   * Whether to mark the widget invalid. An alias of the `aria-invalid` attribute.
   * @type {boolean}
   */
  export let invalid = false;
  /**
   * Input value.
   * @type {string | undefined}
   */
  export let value = undefined;
  /**
   * Minimum allowed value.
   * @type {number | undefined}
   */
  export let min = undefined;
  /**
   * Maximum allowed value.
   * @type {number | undefined}
   */
  export let max = undefined;
  /**
   * Value to be added or removed when using the up/down arrow key or button.
   */
  export let step = 1;

  const id = getRandomId('input');
  let edited = false;

  $: maximumFractionDigits = String(step).split('.')[1]?.length || 0;
  $: isMin = typeof min === 'number' && Number(value || 0) <= min;
  $: isMax = typeof max === 'number' && Number(value || 0) >= max;

  $: invalid =
    (required && edited && (value === undefined || value === '')) ||
    (value !== undefined &&
      value !== '' &&
      (Number.isNaN(Number(value)) ||
        (typeof min === 'number' && Number(value || 0) < min) ||
        (typeof max === 'number' && Number(value || 0) > max)));

  let component;

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
  hidden={hidden || undefined}
>
  <div role="none" class="buttons">
    <Button
      iconic
      disabled={disabled || readonly || Number.isNaN(Number(value)) || isMax}
      aria-label={$_('_sui.number_input.increase')}
      aria-controls={id}
      on:click={() => {
        increase();
      }}
    >
      <Icon slot="start-icon" name="expand_less" />
    </Button>
    <Button
      iconic
      disabled={disabled || readonly || Number.isNaN(Number(value)) || isMin}
      aria-label={$_('_sui.number_input.decrease')}
      aria-controls={id}
      on:click={() => {
        decrease();
      }}
    >
      <Icon slot="start-icon" name="expand_more" />
    </Button>
  </div>
  <TextInput
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
    {...$$restProps}
    bind:this={component}
    on:keydown={(event) => {
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
    on:keypress
    on:input
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
