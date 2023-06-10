<!--
  @component
  @see https://w3c.github.io/aria/#textbox
-->
<script>
  import { _ } from 'svelte-i18n';
  import Button from './button.svelte';
  import Icon from './icon.svelte';
  import TextInput from './text-input.svelte';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  /** @type {string?} */
  export let value = undefined;

  export let disabled = false;
  export let min = undefined;
  export let max = undefined;
  export let step = 1;

  $: maximumFractionDigits = String(step).split('.')[1]?.length || 0;
  $: isMin = typeof min === 'number' && Number(value || 0) <= min;
  $: isMax = typeof max === 'number' && Number(value || 0) >= max;

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

<div class="sui number-input {className}">
  <TextInput
    bind:this={component}
    bind:value
    {disabled}
    role="spinbutton"
    aria-valuenow={Number(value || 0)}
    aria-invalid={value !== undefined && Number.isNaN(Number(value))}
    {...$$restProps}
    on:keydown={(event) => {
      const { key, ctrlKey, metaKey, altKey, shiftKey } = event;

      if (key === 'ArrowDown' && !ctrlKey && !metaKey && !altKey && !shiftKey) {
        event.preventDefault();
        decrease();
      }

      if (key === 'ArrowUp' && !ctrlKey && !metaKey && !altKey && !shiftKey) {
        event.preventDefault();
        increase();
      }
    }}
    on:keypress
    on:input
  />
  <Button
    class="iconic"
    disabled={disabled || Number.isNaN(Number(value)) || isMin}
    on:click={() => {
      decrease();
    }}
  >
    <Icon slot="start-icon" name="arrow_downward" label={$_('_sui.number_input.decrease')} />
  </Button>
  <Button
    class="iconic"
    disabled={disabled || Number.isNaN(Number(value)) || isMax}
    on:click={() => {
      increase();
    }}
  >
    <Icon slot="start-icon" name={'arrow_upward'} label={$_('_sui.number_input.increase')} />
  </Button>
</div>

<style lang="scss">
  .number-input {
    width: 100%;
    display: inline-flex;
    align-items: center;

    :global(input) {
      border-radius: 4px 0 0 4px;
    }

    :global(button) {
      flex: none;
      margin-left: -1px;
      border-width: 1px;
      border-color: var(--control-border-color);
      width: 32px;
      height: var(--input--medium--height);

      &:last-child {
        border-radius: 0 4px 4px 0;
      }

      :global(.icon) {
        font-size: var(--font-size--xx-large);
      }
    }
  }
</style>
