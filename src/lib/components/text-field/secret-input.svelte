<!--
  @component
  Similar to `PasswordInput`, but it doesn’t use `type="password"` to hide the input value. Instead,
  it relies on CSS to visually conceal the input to prevent password managers from prompting to save
  the password.
  @see https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/-webkit-text-security
-->
<script>
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
   * @property {string} [value] Input value.
   * @property {Snippet} [visibilityIcon] Visibility icon slot content.
   */

  /**
   * @type {TextInputProps & CommonEventHandlers & InputEventHandlers & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    value = $bindable(),
    flex = false,
    monospace = true,
    class: className,
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    children,
    visibilityIcon,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();

  /**
   * Reference to the `<input>` element.
   * @type {HTMLInputElement | undefined}
   */
  let inputElement = $state();
  let show = $state(false);
</script>

<div
  role="none"
  class="sui secret-input {className}"
  class:flex
  class:disabled
  class:readonly
  class:show
  {hidden}
>
  <TextInput
    bind:element={inputElement}
    {...restProps}
    {id}
    bind:value
    spellcheck="false"
    {flex}
    {monospace}
    {hidden}
    {disabled}
    {readonly}
    {required}
    {invalid}
  />
  <Button
    iconic
    disabled={disabled || readonly}
    pressed={show}
    aria-label={$_(show ? '_sui.secret_input.hide_secret' : '_sui.secret_input.show_secret')}
    aria-controls={id}
    onclick={() => {
      show = !show;
    }}
  >
    {#snippet startIcon()}
      {#if visibilityIcon}
        {@render visibilityIcon()}
      {:else}
        <Icon name={show ? 'visibility_off' : 'visibility'} />
      {/if}
    {/snippet}
  </Button>
</div>

<style lang="scss">
  .secret-input {
    display: inline-flex;
    align-items: center;
    margin: var(--sui-focus-ring-width);
    min-width: var(--sui-textbox-singleline-min-width);

    &.flex:not([hidden]) {
      display: inline-flex; // Avoid Tailwind .flex class collisions
      width: -moz-available;
      width: -webkit-fill-available;
      width: stretch;
      min-width: 0;
    }

    &.show {
      :global {
        input {
          -webkit-text-security: none;
        }
      }
    }

    :global {
      .text-input {
        flex: auto;
        margin: 0 !important;
        width: 0; // = auto
        min-width: 0 !important;
      }

      input {
        border-start-end-radius: 0;
        border-end-end-radius: 0;
        -webkit-text-security: disc;
      }

      button {
        flex: none;
        margin-block: 0;
        margin-inline-start: -1px;
        margin-inline-end: 0;
        border-width: 1px;
        border-color: var(--sui-textbox-border-color);
        width: var(--sui-textbox-height);
        aspect-ratio: 1 / 1;

        &:last-child {
          border-start-start-radius: 0;
          border-start-end-radius: 4px;
          border-end-end-radius: 4px;
          border-end-start-radius: 0;
        }

        .icon {
          font-size: var(--sui-font-size-xx-large);
        }
      }
    }
  }
</style>
