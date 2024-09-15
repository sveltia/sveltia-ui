<!--
  @component
  A list widget with selectable options. The equivalent of the HTML `<select multiple>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
  @see https://w3c.github.io/aria/#listbox
  @see https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
-->
<script>
  import { activateGroup } from '../../services/group.svelte';

  /**
   * @typedef {object} Props
   * @property {string} [class] - The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] - Whether to hide the widget. An alias of the `aria-hidden`
   * attribute.
   * @property {boolean} [disabled] - Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [readonly] - Whether to make the widget read-only. An alias of the
   * `aria-readonly` attribute.
   * @property {boolean} [required] - Whether to mark the widget required. An alias of the
   * `aria-required` attribute.
   * @property {boolean} [invalid] - Whether to mark the widget invalid. An alias of the
   * `aria-invalid` attribute.
   * @property {boolean} [multiple] - Whether to allow selecting more than one `<Option>`. An alias
   * of the `aria-multiselectable` attribute.
   * @property {string} [searchTerms] - Search terms to be used to filter the items.
   * @property {import('svelte').Snippet} [children] - Primary slot content.
   * @property {(event: CustomEvent) => void} [onChange] - Custom `Change` event handler.
   * @property {(event: CustomEvent) => void} [onFilter] - Custom `Filter` event handler.
   */

  /**
   * @type {import('$lib/typedefs').CommonEventHandlers & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    multiple = false,
    searchTerms = '',
    children,
    onFilter,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * @type {boolean}
   */
  let filtered = $state(false);
</script>

<div
  {...restProps}
  role="listbox"
  class="sui listbox {className}"
  class:filtered
  tabindex={disabled ? -1 : 0}
  {hidden}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-readonly={readonly}
  aria-required={required}
  aria-invalid={invalid}
  aria-multiselectable={multiple}
  onFilter={(/** @type {CustomEvent} */ event) => {
    const {
      detail: { matched, total },
    } = event;

    filtered = matched !== total;
    onFilter?.(event);
  }}
  use:activateGroup={{ searchTerms }}
>
  <div role="none" class="inner" inert={disabled}>
    {@render children?.()}
  </div>
</div>

<style lang="scss">
  [role='listbox'] {
    display: flex;
    flex-direction: column;
    margin: var(--sui-focus-ring-width);
    border-width: var(--sui-listbox-border-width, 1px);
    border-style: var(--sui-listbox-border-style, solid);
    border-color: var(--sui-listbox-border-width, var(--sui-secondary-border-color));
    border-radius: var(--sui-listbox-border-radius, 4px);
    padding: var(--sui-listbox-padding, 4px);
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

    &.in-combobox:focus-visible {
      outline-color: transparent;
    }

    &.filtered {
      :global([role='separator']) {
        display: none;
      }
    }
  }

  .inner {
    display: contents;
  }
</style>
