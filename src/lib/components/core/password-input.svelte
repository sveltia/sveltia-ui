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
   * @type {String}
   */
  let className = '';

  export { className as class };

  /** @type {(String|undefined)} */
  export let value = undefined;

  /**
   * @type {TextInput}
   */
  let inputComponent;
  let passwordVisible = false;

  $: {
    if (inputComponent) {
      inputComponent.element.setAttribute('type', passwordVisible ? 'text' : 'password');
    }
  }
</script>

<div class="sui password-input {className}">
  <TextInput
    bind:this={inputComponent}
    bind:value
    type="password"
    {...$$restProps}
    on:input
    on:keypress
    on:change
  />
  <Button
    class="iconic"
    pressed={passwordVisible}
    on:click={() => {
      passwordVisible = !passwordVisible;
    }}
  >
    <Icon
      slot="start-icon"
      name={passwordVisible ? 'visibility_off' : 'visibility'}
      label={$_('_sui.password_input.show_password')}
    />
  </Button>
</div>

<style lang="scss">
  .password-input {
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
      height: var(--input--medium--height);
      aspect-ratio: 1 / 1;

      &:last-child {
        border-radius: 0 4px 4px 0;
      }

      :global(.icon) {
        font-size: var(--font-size--xx-large);
      }
    }
  }
</style>
