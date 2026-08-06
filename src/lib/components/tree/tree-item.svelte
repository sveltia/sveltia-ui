<!--
  @component
  An item (node) within the `<Tree>` widget. An item that has the `items` slot content becomes a
  parent node that can be expanded and collapsed.
  @see https://w3c.github.io/aria/#treeitem
  @see https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
-->
<script>
  import { isRTL } from '@sveltia/i18n';
  import { getContext, setContext } from 'svelte';
  import Icon from '../icon/icon.svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { Attachment } from 'svelte/attachments';
   * @import { CommonEventHandlers } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] Whether to hide the widget. An alias of the `aria-hidden`
   * attribute.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [selected] Whether to select the item. An alias of the `aria-selected`
   * attribute.
   * @property {boolean} [expanded] Whether to expand the item. An alias of the `aria-expanded`
   * attribute. Ignored if the item has no `items` slot content.
   * @property {string} [label] Text label displayed on the item.
   * @property {any} [value] The `data-value` attribute on the item. Default: the `label`.
   * @property {string} [valueType] Data type of the `value`. Typically `string`, `number` or
   * `boolean`. Default: auto detect.
   * @property {Snippet} [children] Primary slot content, used instead of the `label`.
   * @property {Snippet} [items] Child items slot content, which makes the item a parent node.
   * @property {Snippet} [startIcon] Start icon slot content.
   * @property {Snippet} [endIcon] End icon slot content.
   * @property {Snippet} [chevronIcon] Chevron icon slot content.
   * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler, called when
   * the selection state is changed.
   * @property {(event: CustomEvent) => void} [onSelect] Custom `Select` event handler.
   * @property {(event: CustomEvent) => void} [onExpand] Custom `Expand` event handler, called when
   * the item is expanded or collapsed.
   */

  /**
   * @type {CommonEventHandlers & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    selected = $bindable(false),
    expanded = $bindable(false),
    class: className,
    hidden = false,
    disabled = false,
    label = '',
    // svelte-ignore state_referenced_locally
    value = label,
    // svelte-ignore state_referenced_locally
    valueType = typeof value,
    children,
    items,
    startIcon,
    endIcon,
    chevronIcon,
    onChange,
    onSelect,
    onExpand,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();
  /** Nesting level of the item, starting with 1 for the root level items. */
  const level = /** @type {number} */ (getContext('sui:tree-item-level') ?? 0) + 1;

  setContext('sui:tree-item-level', level);

  /**
   * Handle the `Change` event dispatched by the parent widget when the selection state is changed.
   * @param {any} event `Change` event.
   */
  const handleChange = (event) => {
    selected = event.detail.selected;
    onChange?.(event);
  };

  /**
   * Handle the `Expand` event dispatched by the parent widget when the item is expanded or
   * collapsed.
   * @param {any} event `Expand` event.
   */
  const handleExpand = (event) => {
    expanded = event.detail.expanded;
    onExpand?.(event);
  };

  /**
   * Handle the `Select` event dispatched by the parent widget when the item is selected.
   * @param {any} event `Select` event.
   */
  const handleSelect = (event) => {
    onSelect?.(event);
  };

  /**
   * Listen to the custom events dispatched on the item element by the parent `<Tree>` widget, so
   * the component state can be kept in sync with the DOM state.
   * @type {Attachment}
   */
  const handleEvents = (element) => {
    /** @type {[string, (event: any) => void][]} */
    const listeners = [
      ['Change', handleChange],
      ['Expand', handleExpand],
      ['Select', handleSelect],
    ];

    listeners.forEach(([type, handler]) => {
      element.addEventListener(type, handler);
    });

    return () => {
      listeners.forEach(([type, handler]) => {
        element.removeEventListener(type, handler);
      });
    };
  };
</script>

<div
  {...restProps}
  {id}
  role="treeitem"
  class="sui treeitem {className}"
  tabindex="-1"
  {hidden}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-selected={selected}
  aria-expanded={items ? expanded : undefined}
  aria-level={level}
  aria-labelledby="{id}-label"
  data-label={label}
  data-value={value}
  data-type={valueType}
  {@attach handleEvents}
>
  <div role="none" class="row" style:--sui-tree-item-level={level}>
    {#if items}
      <span role="none" class="chevron" data-action="toggle">
        {#if chevronIcon}
          {@render chevronIcon()}
        {:else}
          <Icon name={isRTL() ? 'chevron_left' : 'chevron_right'} />
        {/if}
      </span>
    {:else}
      <span role="none" class="chevron placeholder"></span>
    {/if}
    {@render startIcon?.()}
    <span role="none" class="label" id="{id}-label">
      {#if label}
        {label}
      {:else}
        {@render children?.()}
      {/if}
    </span>
    {@render endIcon?.()}
  </div>
  {#if items}
    <div role="group" class="group" hidden={!expanded}>
      {@render items()}
    </div>
  {/if}
</div>

<style lang="scss">
  [role='treeitem'] {
    display: block;

    &[hidden] {
      display: none;
    }

    // The focus ring and the highlight are applied to the row, not to the whole subtree
    &:focus-visible {
      outline-color: transparent;

      & > .row {
        outline-color: var(--sui-focus-ring-color);
        outline-offset: calc(var(--sui-focus-ring-width) * -1);
      }
    }

    &[aria-selected='true'] > .row {
      color: var(--sui-highlight-foreground-color);
      background-color: var(--sui-selected-background-color);
    }

    // Disabled items are dimmed and made unclickable by the global styles
    & > .row:hover {
      color: var(--sui-highlight-foreground-color);
      background-color: var(--sui-hover-background-color);
    }

    & > .row:active {
      background-color: var(--sui-active-background-color);
    }

    &[aria-expanded='true'] > .row > .chevron {
      &:dir(ltr) {
        transform: rotate(90deg);
      }

      &:dir(rtl) {
        transform: rotate(-90deg);
      }
    }
  }

  .row {
    display: flex;
    align-items: center;
    gap: 4px;
    border-radius: var(--sui-tree-item-border-radius, var(--sui-option-border-radius, 4px));
    padding: var(--sui-tree-item-padding, 0 8px 0 4px);
    padding-inline-start: calc(
      (var(--sui-tree-item-level, 1) - 1) * var(--sui-tree-item-indent, 16px) + 4px
    );
    min-height: var(--sui-tree-item-height, var(--sui-option-height));
    cursor: pointer;
    transition: background-color 200ms;
  }

  .chevron {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--sui-tree-item-chevron-size, 24px);
    height: var(--sui-tree-item-chevron-size, 24px);
    transition: transform 200ms;
  }

  .label {
    flex: auto;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .group {
    display: block;

    &[hidden] {
      display: none;
    }
  }
</style>
