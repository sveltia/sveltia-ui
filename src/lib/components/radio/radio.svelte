<!--
  @component
  The equivalent of the HTML `<input type="radio">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio
  @see https://w3c.github.io/aria/#radio
  @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script>
  import { generateElementId } from '@sveltia/utils/element';
  import Button from '$lib/components/button/button.svelte';

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
   * Whether to check the widget. An alias of the `aria-checked` attribute.
   * @type {boolean}
   */
  export let checked = false;
  /**
   * The `name` attribute on the `<button>` element.
   * @type {string | undefined}
   */
  export let name = undefined;
  /**
   * The `value` attribute on the `<button>` element.
   * @type {string | undefined}
   */
  export let value = undefined;
  /**
   * Text label displayed next to the checkbox.
   * @type {string | undefined}
   */
  export let label = undefined;

  const id = generateElementId('checkbox');

  /**
   * Reference to the `Button` component.
   * @type {Button | undefined}
   */
  let buttonComponent;
</script>

<span
  role="none"
  class="sui radio {className}"
  class:disabled
  hidden={hidden || undefined}
  {...$$restProps}
  on:click={(event) => {
    if (!(/** @type {HTMLElement} */ (event.target).matches('button'))) {
      buttonComponent?.element?.click();
    }
  }}
>
  <Button
    role="radio"
    {id}
    {hidden}
    {disabled}
    {name}
    {value}
    aria-checked={checked}
    aria-labelledby="{id}-label"
    bind:this={buttonComponent}
    on:click={(event) => {
      event.preventDefault();
      checked = true;
    }}
    on:focus
    on:blur
    on:select
    on:change
  />
  {#if $$slots.default || label}
    <label id="{id}-label">
      {#if $$slots.default}
        <slot />
      {:else}
        {label}
      {/if}
    </label>
  {/if}
</span>

<style lang="scss">
  .radio {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: var(--sui-focus-ring-width);
    color: var(--sui-control-foreground-color);
    font-family: var(--sui-control-font-family);
    font-size: var(--sui-control-font-size);
    line-height: var(--sui-control-line-height);
    cursor: pointer;
    -webkit-user-select: none;
    user-select: none;

    &:hover {
      :global(button) {
        background-color: var(--sui-hover-background-color);
      }

      :global(button[aria-checked='true']) {
        border-color: var(--sui-primary-accent-color-light);
        color: var(--sui-primary-accent-color-text);
      }

      :global(button[aria-checked='true']::before) {
        background-color: var(--sui-primary-accent-color-light);
      }
    }

    &:active {
      :global(button) {
        background-color: var(--sui-active-background-color);
      }

      :global(button[aria-checked='true']) {
        border-color: var(--sui-primary-accent-color-dark);
        color: var(--sui-primary-accent-color-dark);
      }
    }

    :global(button) {
      justify-content: center;
      overflow: hidden;
      margin: 0 !important;
      border-width: 1.5px;
      border-color: var(--sui-checkbox-border-color);
      border-radius: var(--sui-checkbox-height);
      padding: 0;
      width: var(--sui-checkbox-height);
      height: var(--sui-checkbox-height);
      background-color: var(--sui-checkbox-background-color);
      transition: all 200ms;
    }

    :global(button::before) {
      content: '';
      border-radius: var(--sui-checkbox-height);
      width: calc(var(--sui-checkbox-height) - 7px);
      height: calc(var(--sui-checkbox-height) - 7px);
      background-color: var(--sui-primary-accent-color);
      transition: all 200ms;
      will-change: opacity;
    }

    :global(button[aria-checked='true']) {
      border-color: var(--sui-primary-accent-color);
    }

    :global(button[aria-checked='false']::before) {
      opacity: 0;
    }

    label {
      cursor: inherit;
    }
  }
</style>
