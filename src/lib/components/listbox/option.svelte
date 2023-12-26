<!--
  @component
  An option within the `<Listbox>` widget. The equivalent of the HTML `<option>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option
  @see https://w3c.github.io/aria/#option
-->
<script>
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
</script>

<div role="none" class="sui option {className}" hidden={hidden || undefined}>
  <Button
    role="option"
    tabindex="-1"
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
    on:change
    on:change={(event) => {
      selected = event.detail.selected;
    }}
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

    :global(button) {
      flex: none;
      display: flex;
      justify-content: space-between;
      gap: 4px;
      margin: 0 !important;
      border-radius: var(--sui-option-border-radius);
      padding: var(--sui-option-padding);
      width: 100%;
      height: var(--sui-option-height);
      white-space: nowrap;
    }

    :global(.focused),
    :global(button:hover) {
      color: var(--sui-highlight-foreground-color);
      background-color: var(--sui-hover-background-color);
    }

    :global(button:active) {
      background-color: var(--sui-active-background-color);
    }

    :global(button[aria-selected='true']) {
      :global(.icon) {
        color: var(--sui-primary-accent-color-text);
      }
    }
  }
</style>
