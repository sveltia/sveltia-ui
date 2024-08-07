<!--
  @component
  The equivalent of the HTML `<input type="password">` element, but it comes with the Show/Hide
  button.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/password
  @see https://w3c.github.io/aria/#textbox
-->
<script>
  import { generateElementId } from '@sveltia/utils/element';
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

  const id = generateElementId('input');

  /**
   * @type {TextInput}
   */
  let inputComponent;
  let passwordVisible = false;

  $: {
    if (inputComponent) {
      inputComponent.element?.setAttribute('type', passwordVisible ? 'text' : 'password');
    }
  }
</script>

<div
  role="none"
  class="sui password-input {className}"
  class:flex
  class:disabled
  class:readonly
  hidden={hidden || undefined}
>
  <TextInput
    {id}
    bind:value
    type="password"
    spellcheck="false"
    {flex}
    {hidden}
    {disabled}
    {readonly}
    {required}
    {invalid}
    {...$$restProps}
    bind:this={inputComponent}
    on:keydown
    on:keyup
    on:keypress
    on:input
    on:change
  />
  <Button
    iconic
    disabled={disabled || readonly}
    pressed={passwordVisible}
    aria-label={$_(
      passwordVisible ? '_sui.password_input.hide_password' : '_sui.password_input.show_password',
    )}
    aria-controls={id}
    on:click={() => {
      passwordVisible = !passwordVisible;
    }}
  >
    <slot name="visibility-icon" slot="start-icon">
      <Icon name={passwordVisible ? 'visibility_off' : 'visibility'} />
    </slot>
  </Button>
</div>

<style lang="scss">
  .password-input {
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

    :global(.text-input) {
      flex: auto;
      margin: 0 !important;
      width: 0; // = auto
      min-width: 0 !important;
    }

    :global(input) {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }

    :global(button) {
      flex: none;
      margin: 0 0 0 -1px;
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
