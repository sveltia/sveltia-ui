<!--
  @component
  A list widget with selectable options. The equivalent of the HTML `<select multiple>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
  @see https://w3c.github.io/aria/#listbox
  @see https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
-->
<script>
  import { activateGroup } from '../../services/group';

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
   * Whether to allow selecting more than one `<Option>`. An alias of the `aria-multiselectable`
   * attribute.
   * @type {boolean}
   */
  export let multiple = false;
</script>

<div
  role="listbox"
  class="sui listbox {className}"
  tabindex={disabled ? -1 : 0}
  hidden={hidden || undefined}
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
  <div role="none" class="inner" inert={disabled}>
    <slot />
  </div>
</div>

<style lang="scss">
  [role='listbox'] {
    display: flex;
    flex-direction: column;
    margin: 0;
    border-width: 1px;
    border-color: var(--sui-listbox-border-color);
    border-radius: var(--sui-listbox-border-radius);
    padding: 4px;
    min-width: var(--sui-listbox-min-width, calc(var(--sui-option-height) * 5));
    color: var(--sui-listbox-foreground-color);
    background-color: var(--sui-listbox-background-color);
    font-family: var(--sui-control-font-family);
    font-size: var(--sui-control-font-size);
    line-height: var(--sui-control-line-height);

    :global([role='separator']) {
      margin: 4px;
      background-color: var(--sui-control-border-color);
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
        border-color: var(--sui-primary-accent-color-light);
      }
    }
  }

  .inner {
    display: contents;
  }
</style>
