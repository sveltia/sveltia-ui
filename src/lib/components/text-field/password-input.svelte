<!--
  @component
  The equivalent of the HTML `<input type="password">` element, but it comes with the Show/Hide
  button.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/password
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

<div class="sui password-input {className}" class:disabled hidden={hidden || undefined}>
  <TextInput
    bind:this={inputComponent}
    bind:value
    type="password"
    {hidden}
    {disabled}
    {readonly}
    {required}
    {invalid}
    {...$$restProps}
    on:input
    on:keypress
    on:change
  />
  <Button
    iconic
    {disabled}
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
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }

    :global(button) {
      flex: none;
      margin-left: -1px;
      border-width: 1px;
      border-color: var(--sui-textbox-border-color);
      width: var(--sui-textbox-height);
      aspect-ratio: 1 / 1;

      &:last-child {
        border-radius: 0 4px 4px 0;
      }

      :global(.icon) {
        font-size: var(--sui-font-size-xx-large);
      }
    }
  }
</style>
