<!--
  @component
  A list widget with selectable options. The equivalent of the HTML `<select multiple>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
  @see https://w3c.github.io/aria/#listbox
  @see https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
-->
<script>
  import { activateGroup } from '../../services/group.svelte.js';
  import { getAccessibleName } from '../../services/label.js';

  /**
   * @import {
   * ButtonProps,
   * CommonEventHandlers,
   * ContainerProps,
   * FormFieldStateProps,
   * WidgetStateProps,
   * } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {boolean} [multiple] Whether to allow selecting more than one `<Option>`. An alias of
   * the `aria-multiselectable` attribute.
   * @property {string} [searchTerms] Search terms to be used to filter the items.
   * @property {string} [ariaLabel] The `aria-label` attribute on the wrapper element.
   * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler.
   * @property {(event: CustomEvent) => void} [onFilter] Custom `Filter` event handler.
   */

  /**
   * @type {CommonEventHandlers & ContainerProps & WidgetStateProps & FormFieldStateProps & Props &
   * Record<string, any>}
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
    ariaLabel = undefined,
    children,
    onChange,
    onFilter,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * @type {boolean}
   */
  let filtered = $state(false);

  /**
   * Handle the `Change` event from the group. The group only selects among the options that are
   * shown, so an option hidden by the search terms keeps its selection. In a single-select listbox,
   * that has to be cleared once another option is selected, or two would be selected once the
   * filter is lifted.
   * @param {CustomEvent} event The `Change` event.
   */
  const _onChange = (event) => {
    const { currentTarget, target } = event;

    // Only the listbox’s own event, not one dispatched on an option and bubbling up
    if (!multiple && target === currentTarget) {
      /** @type {HTMLElement} */ (currentTarget)
        .querySelectorAll('[role="option"][aria-hidden="true"][aria-selected="true"]')
        .forEach((option) => {
          option.setAttribute('aria-selected', 'false');
          option.dispatchEvent(new CustomEvent('Change', { detail: { selected: false } }));
        });
    }

    onChange?.(event);
  };
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
  aria-label={getAccessibleName({ ariaLabel, props: restProps })}
  onChange={_onChange}
  onFilter={(/** @type {CustomEvent} */ event) => {
    const {
      detail: { matched, total },
    } = event;

    filtered = matched !== total;
    onFilter?.(event);
  }}
  {@attach activateGroup(() => ({ searchTerms }))}
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
    border-color: var(--sui-listbox-border-color, var(--sui-secondary-border-color));
    border-radius: var(--sui-listbox-border-radius, 4px);
    padding: var(--sui-listbox-padding, 4px);
    min-width: var(--sui-listbox-min-width, calc(var(--sui-option-height) * 5));
    color: var(--sui-listbox-foreground-color);
    background-color: var(--sui-listbox-background-color);
    font-family: var(--sui-control-font-family);
    font-size: var(--sui-control-font-size);
    line-height: var(--sui-control-line-height);

    :global {
      [role='separator'] {
        margin: 4px 0;
        background-color: var(--sui-control-border-color);
      }
    }

    &[aria-invalid='true'] {
      border-color: var(--sui-error-border-color);
    }

    &.tabs {
      padding: 0;
      border-block-start-width: 0;
      border-block-end-width: 0;
      border-inline-end-width: 1px;
      border-inline-start-width: 0;
      border-color: var(--sui-control-border-color);

      :global {
        .option button {
          justify-content: flex-start;
          border-width: 0;
          border-inline-end-width: 2px;
          border-color: transparent;
          padding: 0 12px;
          border-start-end-radius: 0;
          border-end-end-radius: 0;
          height: var(--sui-tab-medium-height);

          &[aria-selected='true'] {
            border-color: var(--sui-primary-accent-color-light);
          }

          .icon {
            display: none;
          }
        }
      }

      &[aria-readonly='true'] :global(.option button[aria-selected='true']) {
        border-color: var(--sui-readonly-accent-color);
      }
    }

    // The focused option draws its own ring, so hide the listbox’s ring to avoid a double ring.
    // It’s kept when no option is focused, e.g. an empty list, so keyboard focus is still visible.
    &.in-combobox:focus-visible,
    &:focus-visible:has(:global(.focused)) {
      outline-color: transparent;
    }

    &.filtered {
      :global {
        [role='separator'] {
          display: none;
        }
      }
    }
  }

  .inner {
    display: contents;
  }
</style>
