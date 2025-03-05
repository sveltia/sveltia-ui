<!--
  @component
  The equivalent of the HTML `<input type="search">` element. It comes with a magnifier icon and
  clear button.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/search
  @see https://w3c.github.io/aria/#search
-->

<script>
  import { _ } from 'svelte-i18n';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import TextInput from './text-input.svelte';

  /**
   * @typedef {object} Props
   * @property {string} [value] - Input value.
   * @property {import('svelte').Snippet} [searchIcon] - Search icon slot content.
   * @property {import('svelte').Snippet} [closeIcon] - Close icon slot content.
   */

  /**
   * @type {import('$lib/typedefs').TextInputProps & import('$lib/typedefs').CommonEventHandlers &
   * import('$lib/typedefs').InputEventHandlers & Props & Record<string, any>}
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
    searchIcon,
    closeIcon,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();

  /**
   * Reference to the `<input>` element.
   * @type {HTMLInputElement | undefined}
   */
  let inputElement = $state();

  /**
   * Move focus to the `<input>` element.
   */
  export const focus = () => {
    inputElement?.focus();
  };
</script>

<div
  role={hidden ? undefined : 'none'}
  class="sui search-bar {className}"
  class:flex
  class:disabled
  class:readonly
  {hidden}
  aria-hidden={hidden}
>
  <span role="none">
    {#if searchIcon}
      {@render searchIcon()}
    {:else}
      <Icon name="search" />
    {/if}
  </span>
  <TextInput
    bind:element={inputElement}
    {...restProps}
    role="searchbox"
    {id}
    bind:value
    {flex}
    {hidden}
    {disabled}
    {readonly}
    {required}
    {invalid}
    inputmode="search"
  />
  {#if value}
    <Button
      iconic
      aria-label={$_('_sui.clear')}
      aria-controls={id}
      onclick={() => {
        value = '';
        inputElement?.focus();
        globalThis.requestIdleCallback(() => {
          inputElement?.dispatchEvent(new KeyboardEvent('input'));
          inputElement?.dispatchEvent(new KeyboardEvent('keypress'));
          inputElement?.dispatchEvent(new KeyboardEvent('change'));
        });
      }}
    >
      {#snippet startIcon()}
        {#if closeIcon}
          {@render closeIcon()}
        {:else}
          <Icon name="close" />
        {/if}
      {/snippet}
    </Button>
  {/if}
</div>

<style lang="scss">
  .search-bar {
    display: inline-flex;
    align-items: center;
    position: relative;
    margin: var(--sui-focus-ring-width);
    min-width: var(--sui-textbox-singleline-min-width);

    &.flex {
      width: -moz-available;
      width: -webkit-fill-available;
      width: stretch;
      min-width: 0;
    }

    :global(.icon) {
      font-size: var(--sui-font-size-xx-large);
      opacity: 0.5;
    }

    & > span {
      position: absolute;
      inset: 0 auto 0 0;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--sui-button-medium-height);
      height: var(--sui-button-medium-height);
    }

    & > :global(button) {
      position: absolute;
      inset: 0 0 auto auto;
      z-index: 2;
      margin: 0 !important;
      height: var(--sui-button-medium-height);
    }

    :global(.label) {
      --sui-textbox-singleline-padding: 0 36px;
    }

    :global(.text-input) {
      flex: auto;
      margin: 0 !important;
      width: 0; // = auto
      min-width: 0 !important;
    }

    :global(input) {
      z-index: 1;
      padding: 0 var(--sui-button-medium-height) !important;
      width: 100%;
    }
  }
</style>
