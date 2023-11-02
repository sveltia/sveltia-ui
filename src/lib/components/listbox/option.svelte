<!--
  @component
  An option within the `<Listbox>` widget. The equivalent of the HTML `<option>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option
  @see https://w3c.github.io/aria/#option
-->
<script>
  import { onMount } from 'svelte';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';

  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * Whether to select the widget. An alias of the `aria-selected` attribute.
   * @type {boolean}
   */
  export let selected = false;
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
   * Text label displayed on the item.
   * @type {string | undefined}
   */
  export let label = '';
  /**
   * The `value` attribute on the `<button>` element.
   * @type {string | undefined}
   */
  export let value = undefined;

  /**
   * Reference to the `Button` component.
   * @type {Button | undefined}
   */
  let buttonComponent;

  /**
   * Event listener for the `select` event fired in `group.js`.
   * @param {CustomEvent} event `select` event.
   */
  const listener = ({ type }) => {
    selected = type === 'select';
  };

  onMount(() => {
    buttonComponent.element.addEventListener('select', listener);
    buttonComponent.element.addEventListener('unselect', listener);

    return () => {
      buttonComponent.element.removeEventListener('select', listener);
      buttonComponent.element.removeEventListener('unselect', listener);
    };
  });
</script>

<div class="sui option {className}" hidden={hidden || undefined}>
  <Button
    bind:this={buttonComponent}
    tabindex="-1"
    role="option"
    aria-selected={selected}
    {label}
    {value}
    {hidden}
    {disabled}
    data-type={typeof value}
    {...$$restProps}
    on:click
    on:dragover
    on:dragleave
    on:dragend
    on:drop
    on:select
  >
    {#if selected}
      <Icon class="check" name="check" />
    {/if}
    <slot name="start-icon" slot="start-icon" />
    <slot />
    <slot name="end-icon" slot="end-icon" />
  </Button>
</div>

<style lang="scss">
  .option {
    display: contents;

    &:focus-visible {
      outline-width: 0 !important;
    }

    :global([role='option']) {
      flex: none;
      display: flex;
      justify-content: space-between;
      gap: 4px;
      border-radius: 4px;
      padding: 0 8px 0 16px;
      width: 100%;
      height: var(--sui-option-medium-height);
      white-space: nowrap;
    }

    :global(.focused),
    :global([role='option']:hover) {
      color: var(--sui-highlight-foreground-color);
      background-color: var(--sui-highlight-background-color);
    }

    :global([role='option'][aria-selected='true']) {
      :global(.icon) {
        color: var(--sui-primary-accent-color-lighter);
      }
    }
  }
</style>
