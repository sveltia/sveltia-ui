<!--
  @component
  The equivalent of the HTML `<input type="checkbox">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox
  @see https://w3c.github.io/aria/#checkbox
  @see https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import { getRandomId } from '../../services/util';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';

  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
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
   * Whether to make the widget read-only. An alias of the `aria-readonly` attribute.
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
   * Whether to check the widget. An alias of the `aria-checked` attribute.
   * @type {boolean | 'mixed'}
   */
  export let checked = false;
  /**
   * Text label displayed next to the checkbox.
   * @type {string | undefined}
   */
  export let label = undefined;

  const dispatch = createEventDispatcher();
  const id = getRandomId('checkbox');

  /**
   * Reference to the `Button` component.
   * @type {Button | undefined}
   */
  let buttonComponent = undefined;

  $: ariaLabel = $$restProps['aria-label'];
  $: indeterminate = checked === 'mixed';
</script>

<div
  class="sui checkbox {className}"
  class:checked
  class:indeterminate
  class:disabled
  class:readonly
  hidden={hidden || undefined}
  role="none"
  {...$$restProps}
  on:click|preventDefault|stopPropagation={(event) => {
    if (!(/** @type {HTMLElement} */ (event.target).matches('button'))) {
      buttonComponent.element.click();
    }
  }}
>
  <div class="inner" inert={disabled}>
    <Button
      {id}
      {name}
      {value}
      role="checkbox"
      {hidden}
      {disabled}
      {readonly}
      {required}
      {invalid}
      aria-checked={checked}
      aria-label={ariaLabel || undefined}
      aria-labelledby={ariaLabel ? undefined : '{id}-label'}
      bind:this={buttonComponent}
      on:click={(event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!disabled && !readonly) {
          checked = indeterminate ? true : !checked;
          dispatch('change', { checked });
        }
      }}
    >
      <Icon slot="start-icon" name={indeterminate ? 'remove' : 'check'} />
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
  </div>
</div>

<style lang="scss">
  .checkbox {
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

    &:hover {
      :global(button) {
        background-color: var(--sui-hover-background-color);
      }

      :global(button[aria-checked='true']) {
        background-color: var(--sui-primary-accent-color-light);
      }
    }

    &:active {
      :global(button) {
        background-color: var(--sui-active-background-color);
      }

      :global(button[aria-checked='true']) {
        background-color: var(--sui-primary-accent-color-dark);
      }
    }

    :global(button) {
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-width: 1.5px;
      border-color: var(--sui-checkbox-border-color);
      border-radius: var(--sui-checkbox-border-radius);
      padding: 0;
      width: var(--sui-checkbox-height);
      height: var(--sui-checkbox-height);
      color: var(--sui-primary-accent-text-color);
      background-color: var(--sui-checkbox-background-color);
      transition: all 200ms;

      :global(.icon) {
        font-size: calc(var(--sui-checkbox-height) - 2px);
      }
    }

    :global(button[aria-checked='true']) {
      border-color: var(--sui-primary-accent-color);
      color: var(--sui-primary-accent-color-inverted);
      background-color: var(--sui-primary-accent-color);
    }

    :global(button[aria-checked='false']) {
      color: transparent;
    }

    label {
      cursor: inherit;
    }
  }

  .inner {
    display: contents;
  }
</style>
