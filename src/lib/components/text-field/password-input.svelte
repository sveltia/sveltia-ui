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
  let passwordVisible = $state(false);

  $effect(() => {
    inputElement?.setAttribute('type', passwordVisible ? 'text' : 'password');
  });
</script>

<div
  role="none"
  class="sui password-input {className}"
  class:flex
  class:disabled
  class:readonly
  {hidden}
>
  <TextInput
    bind:element={inputElement}
    {...restProps}
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
  />
  <Button
    iconic
    disabled={disabled || readonly}
    pressed={passwordVisible}
    aria-label={$_(
      passwordVisible ? '_sui.password_input.hide_password' : '_sui.password_input.show_password',
    )}
    aria-controls={id}
    onclick={() => {
      passwordVisible = !passwordVisible;
    }}
  >
    {#snippet startIcon()}
      {#if visibilityIcon}
        {@render visibilityIcon()}
      {:else}
        <Icon name={passwordVisible ? 'visibility_off' : 'visibility'} />
      {/if}
    {/snippet}
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

    :global {
      .text-input {
        flex: auto;
        margin: 0 !important;
        width: 0; // = auto
        min-width: 0 !important;
      }

      input {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }

      button {
        flex: none;
        margin: 0 0 0 -1px;
        border-width: 1px;
        border-color: var(--sui-textbox-border-color);
        width: var(--sui-textbox-height);
        aspect-ratio: 1 / 1;

        &:last-child {
          border-radius: 0 4px 4px 0;
        }

        .icon {
          font-size: var(--sui-font-size-xx-large);
        }
      }
    }
  }
</style>
