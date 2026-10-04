<!--
  @component
  Internal base of `<PasswordInput>` and `<SecretInput>`: a text field whose value is masked, with a
  Show/Hide button.
-->
<script>
  import { _ } from '@sveltia/i18n';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import TextInput from './text-input.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { CommonEventHandlers, InputEventHandlers, TextInputProps } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {'type' | 'css'} mask How to mask the value: `type` uses `type="password"`, while
   * `css` uses `-webkit-text-security` so password managers don’t prompt to save the value.
   * @property {string} [value] Input value.
   * @property {Snippet} [visibilityIcon] Visibility icon slot content.
   */

  /**
   * @type {TextInputProps & CommonEventHandlers & InputEventHandlers & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    mask,
    value = $bindable(),
    flex = false,
    monospace = true,
    class: className,
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    // Not rendered, but kept out of `restProps` so it isn’t spread onto the `<input>`
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

  const labels = $derived(
    mask === 'type'
      ? {
          show: '_sui.password_input.show_password',
          hide: '_sui.password_input.hide_password',
        }
      : {
          show: '_sui.secret_input.show_secret',
          hide: '_sui.secret_input.hide_secret',
        },
  );

  $effect(() => {
    if (mask === 'type') {
      inputElement?.setAttribute('type', show ? 'text' : 'password');
    }
  });
</script>

<div
  role="none"
  class="sui {mask === 'type' ? 'password-input' : 'secret-input'} {className}"
  class:flex
  class:disabled
  class:readonly
  class:show={mask === 'css' && show}
  {hidden}
>
  <!-- With the `css` mask, the field is masked with CSS rather than `type="password"`, so opt out
  of the features that would remember the secret, like autofill history and the keyboard’s learned
  words -->
  <TextInput
    dir="ltr"
    bind:element={inputElement}
    {...mask === 'css' ? { autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off' } : {}}
    {...restProps}
    {id}
    bind:value
    {...mask === 'type' ? { type: 'password' } : {}}
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
    aria-label={_(show ? labels.hide : labels.show)}
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
  @use '../../styles/mixins';

  .password-input,
  .secret-input {
    display: inline-flex;
    align-items: center;
    margin: var(--sui-focus-ring-width);
    min-width: var(--sui-textbox-singleline-min-width);

    @include mixins.flex-stretch;

    :global {
      @include mixins.embedded-text-input;

      input {
        border-start-end-radius: 0;
        border-end-end-radius: 0;
      }

      button {
        margin-block: 0;
        margin-inline-end: 0;

        @include mixins.attached-button(width);
      }
    }
  }

  .secret-input {
    &.show {
      :global {
        input {
          -webkit-text-security: none;
        }
      }
    }

    :global {
      input {
        -webkit-text-security: disc;
      }
    }
  }
</style>
