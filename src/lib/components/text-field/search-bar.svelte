<!--
  @component
  The equivalent of the HTML `<input type="search">` element. It comes with a magnifier icon and
  clear button.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/search
  @see https://w3c.github.io/aria/#search
-->
<svelte:options accessors={true} />

<script>
  import { generateElementId } from '@sveltia/utils/element';
  import { _ } from 'svelte-i18n';
  import Button from '$lib/components/button/button.svelte';
  import Icon from '$lib/components/icon/icon.svelte';
  import TextInput from '$lib/components/text-field/text-input.svelte';

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

  const id = generateElementId('searchbox');
  /**
   * Reference to the `TextInput` component.
   * @type {TextInput | undefined}
   */
  let inputComponent;

  $: input = inputComponent?.element;

  /**
   * Move focus to the `<input>` element.
   */
  export const focus = () => {
    input?.focus();
  };
</script>

<div
  role={hidden ? undefined : 'none'}
  class="sui search-bar {className}"
  class:flex
  class:disabled
  class:readonly
  hidden={hidden || undefined}
  aria-hidden={hidden}
>
  <span role="none">
    <slot name="search-icon">
      <Icon name="search" />
    </slot>
  </span>
  <TextInput
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
    {...$$restProps}
    bind:this={inputComponent}
    on:keydown
    on:keyup
    on:keypress
    on:input
    on:change
  />
  {#if value}
    <Button
      iconic
      aria-label={$_('_sui.clear')}
      aria-controls={id}
      on:click={() => {
        value = '';
        input?.focus();
        globalThis.requestIdleCallback(() => {
          input?.dispatchEvent(new KeyboardEvent('input'));
          input?.dispatchEvent(new KeyboardEvent('keypress'));
          input?.dispatchEvent(new KeyboardEvent('change'));
        });
      }}
    >
      <slot name="close-button" slot="start-icon">
        <Icon name="close" />
      </slot>
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
