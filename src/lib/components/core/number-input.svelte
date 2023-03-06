<!--
  @component
  @see https://w3c.github.io/aria/#textbox
-->
<script>
  import { _ } from 'svelte-i18n';
  import Button from './button.svelte';
  import TextInput from './text-input.svelte';

  /**
   * CSS class name on the button.
   * @type {String}
   */
  let className = '';

  export { className as class };

  /** @type {(String|undefined)} */
  export let value = undefined;

  export let min = undefined;
  export let max = undefined;
  export let step = 1;

  let component;

  const decrease = () => {
    if (typeof min === 'number' && Number(value || 0) === min) {
      return;
    }

    value = String(Number(value || 0) - step);
  };

  const increase = () => {
    if (typeof min === 'number' && Number(value || 0) === max) {
      return;
    }

    value = String(Number(value || 0) + step);
  };
</script>

<div class="sui number-input {className}">
  <TextInput
    bind:this={component}
    bind:value
    role="spinbutton"
    aria-valuenow={Number(value || 0)}
    aria-invalid={Number.isNaN(Number(value))}
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
    disabled={Number.isNaN(Number(value))}
    iconLabel={$_('sui.number_input.decrease')}
    iconName={'arrow_downward'}
    on:click={() => {
      decrease();
    }}
  />
  <Button
    class="iconic"
    disabled={Number.isNaN(Number(value))}
    iconLabel={$_('sui.number_input.increase')}
    iconName={'arrow_upward'}
    on:click={() => {
      increase();
    }}
  />
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
        font-size: 20px;
      }
    }
  }
</style>
