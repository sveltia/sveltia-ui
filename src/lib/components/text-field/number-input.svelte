<!--
  @component
  The equivalent of the HTML `<input type="number">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number
  @see https://w3c.github.io/aria/#textbox
-->
<script>
  import { _ } from 'svelte-i18n';
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

  $: maximumFractionDigits = String(step).split('.')[1]?.length || 0;
  $: isMin = typeof min === 'number' && Number(value || 0) <= min;
  $: isMax = typeof max === 'number' && Number(value || 0) >= max;

  $: invalid =
    (value !== undefined && Number.isNaN(Number(value))) ||
    (typeof min === 'number' && Number(value || 0) < min) ||
    (typeof max === 'number' && Number(value || 0) > max);

  let component;

  /**
   *
   */
  const decrease = () => {
    if (isMin) {
      return;
    }

    value = Number(Number(value || 0) - step).toFixed(maximumFractionDigits);
  };

  /**
   *
   */
  const increase = () => {
    if (isMax) {
      return;
    }

    value = Number(Number(value || 0) + step).toFixed(maximumFractionDigits);
  };
</script>

<div
  class="sui number-input {className}"
  class:disabled
  class:readonly
  hidden={hidden || undefined}
>
  <div class="buttons">
    <Button
      iconic
      disabled={disabled || readonly || Number.isNaN(Number(value)) || isMax}
      on:click={() => {
        increase();
      }}
    >
      <Icon slot="start-icon" name="expand_less" label={$_('_sui.number_input.increase')} />
    </Button>
    <Button
      iconic
      disabled={disabled || readonly || Number.isNaN(Number(value)) || isMin}
      on:click={() => {
        decrease();
      }}
    >
      <Icon slot="start-icon" name="expand_more" label={$_('_sui.number_input.decrease')} />
    </Button>
  </div>
  <TextInput
    bind:this={component}
    bind:value
    role="spinbutton"
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
    }}
    on:keypress
    on:input
  />
</div>

<style lang="scss">
  .number-input {
    width: 100%;
    display: inline-flex;
    align-items: center;

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
  }

  .buttons {
    display: flex;
    flex-direction: column;
    width: 24px;
    height: var(--sui-textbox-height);

    :global(button) {
      flex: none;
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
