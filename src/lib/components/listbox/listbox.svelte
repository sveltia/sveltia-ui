<!--
  @component
  A list widget with selectable options. The equivalent of the HTML `<select multiple>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
  @see https://w3c.github.io/aria/#listbox
  @see https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
-->
<script>
  import { activateGroup } from '../util/group';

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
   * Whether to disable the widget. An alias of the `aria-readonly` attribute.
   * @type {boolean}
   */
  export let readonly = false;
  /**
   * Whether to disable the widget. An alias of the `aria-required` attribute.
   * @type {boolean}
   */
  export let required = false;
  /**
   * Whether to disable the widget. An alias of the `aria-invalid` attribute.
   * @type {boolean}
   */
  export let invalid = false;
  /**
   * Whether to allow selecting more than one `<Option>`. An alias of the `aria-multiselectable`
   * attribute.
   * @type {boolean}
   */
  export let multiple = false;

  // Work around a Svelte issue with assigning boolean attributes
  $: $$restProps.hidden = hidden ? 'hidden' : undefined;
</script>

<div
  class="sui listbox {className}"
  tabindex="0"
  role="listbox"
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-readonly={readonly}
  aria-required={required}
  aria-invalid={invalid}
  aria-multiselectable={multiple}
  {...$$restProps}
  use:activateGroup
  on:click
  on:change
>
  <div class="inner" inert={disabled}>
    <slot />
  </div>
</div>

<style lang="scss">
  [role='listbox'] {
    display: flex;
    flex-direction: column;
    margin: 0;
    border-width: 1px;
    border-color: var(--sui-control-border-color);
    border-radius: 4px;
    padding: 4px;
    min-width: 160px;
    color: var(--sui-control-foreground-color);
    background-color: var(--sui-control-background-color);
    font-family: var(--sui-control-font-family);
    font-size: var(--sui-control-font-size);
    line-height: var(--sui-control-line-height);

    :global([role='separator']) {
      margin: 4px;
    }

    &:global(.tabs) {
      padding: 0;
      border-width: 0 1px 0 0;
      border-color: var(--sui-control-border-color);

      :global(.option button) {
        justify-content: flex-start;
        border-width: 0 2px 0 0;
        border-color: transparent;
        padding: 0 12px;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        height: var(--sui-tab-medium-height);

        :global(.icon) {
          display: none;
        }
      }

      :global(.option button[aria-selected='true']) {
        border-color: var(--sui-primary-accent-color-lighter);
      }
    }
  }

  .inner {
    display: contents;
  }
</style>
