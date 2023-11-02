<!--
  @component
  The equivalent of the HTML `<input type="radio">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio
  @see https://w3c.github.io/aria/#radio
  @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script>
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import { getRandomId } from '../util/util';

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

  const id = getRandomId('checkbox');

  /**
   * Reference to the `Button` component.
   * @type {Button | undefined}
   */
  let buttonComponent;

  // Work around a Svelte issue with assigning boolean attributes
  $: $$restProps.hidden = hidden ? 'hidden' : undefined;
</script>

<span
  class="sui radio {className}"
  role="none"
  {...$$restProps}
  on:click={(event) => {
    if (!(/** @type {HTMLElement} */ (event.target).matches('button'))) {
      buttonComponent.element.click();
    }
  }}
>
  <Button
    {id}
    role="radio"
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
    on:select
  >
    <Icon slot="start-icon" name="circle" />
  </Button>
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
    color: var(--sui-control-foreground-color);
    font-family: var(--sui-control-font-family);
    font-size: var(--sui-control-font-size);
    line-height: var(--sui-control-line-height);
    cursor: pointer;
    -webkit-user-select: none;
    user-select: none;

    &.disabled {
      cursor: default;

      label {
        color: var(--sui-disabled-foreground-color);
      }
    }

    :global(button) {
      justify-content: center;
      overflow: hidden;
      border-width: 2px;
      border-color: var(--sui-checkbox-border-color);
      border-radius: 24px;
      width: 20px;
      height: 20px;
      color: var(--sui-primary-accent-color-lighter);
      transition: all 200ms;

      :global(.icon) {
        font-size: 14px;
        font-variation-settings:
          'FILL' 1,
          'wght' 400,
          'GRAD' 0,
          'opsz' 48;
      }
    }

    :global(button[aria-checked='true']) {
      border-color: var(--sui-primary-accent-color-lighter);
      color: var(--sui-primary-accent-color-lighter);
    }

    :global(button[aria-checked='false']) {
      color: transparent;
    }

    label {
      cursor: inherit;
    }
  }
</style>
