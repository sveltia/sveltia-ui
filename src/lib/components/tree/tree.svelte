<!--
  @component
  A tree view widget that displays a hierarchical list of items, which can be expanded, collapsed
  and selected.
  @see https://w3c.github.io/aria/#tree
  @see https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
-->
<script>
  import { activateTree } from '../../services/tree.svelte.js';

  /**
   * @import { Snippet } from 'svelte';
   * @import { CommonEventHandlers } from '$lib/typedefs';
   */

  /**
   * @typedef {object} Props
   * @property {HTMLElement} [element] A reference to the wrapper element.
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] Whether to hide the widget. An alias of the `aria-hidden`
   * attribute.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [readonly] Whether to make the widget read-only. An alias of the
   * `aria-readonly` attribute.
   * @property {boolean} [multiple] Whether to allow selecting more than one `<TreeItem>`. An alias
   * of the `aria-multiselectable` attribute.
   * @property {boolean} [clickToSelect] Whether to select an item by clicking on it.
   * @property {boolean} [selectionFollowsFocus] Whether to select an item as soon as it receives
   * focus. Default: `true` on a single-select tree, `false` on a multi-select tree.
   * @property {boolean} [expandOnSelect] Whether to expand or collapse a parent item when the item
   * itself, rather than its chevron, is clicked or activated with the Enter key.
   * @property {string} [ariaLabel] The `aria-label` attribute on the wrapper element. Required
   * unless the `aria-labelledby` attribute is provided.
   * @property {Snippet} [children] Primary slot content.
   * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler.
   */

  /**
   * @type {CommonEventHandlers & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    element = $bindable(),
    class: className,
    hidden = false,
    disabled = false,
    readonly = false,
    multiple = false,
    clickToSelect = true,
    selectionFollowsFocus = undefined,
    expandOnSelect = true,
    ariaLabel = undefined,
    children,
    onChange,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<!--
  The `aria-readonly` attribute is not part of the `tree` role in ARIA, but we still use it to keep
  the API consistent with the other selection widgets, including `<Listbox>`. It’s only rendered
  when the widget is actually read-only, so assistive technologies can safely ignore it.
-->
<!-- svelte-ignore a11y_role_supports_aria_props -->
<div
  bind:this={element}
  {...restProps}
  role="tree"
  class="sui tree {className}"
  {hidden}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-readonly={readonly || undefined}
  aria-multiselectable={multiple}
  aria-label={ariaLabel}
  onChange={(/** @type {CustomEvent} */ event) => {
    onChange?.(event);
  }}
  {@attach activateTree({ clickToSelect, selectionFollowsFocus, expandOnSelect })}
>
  <div role="none" class="inner" inert={disabled}>
    {@render children?.()}
  </div>
</div>

<style lang="scss">
  [role='tree'] {
    display: flex;
    flex-direction: column;
    margin: var(--sui-focus-ring-width);
    border-width: var(--sui-tree-border-width, 1px);
    border-style: var(--sui-tree-border-style, solid);
    border-color: var(--sui-tree-border-color, var(--sui-secondary-border-color));
    border-radius: var(--sui-tree-border-radius, 4px);
    padding: var(--sui-tree-padding, 4px);
    min-width: var(--sui-tree-min-width, calc(var(--sui-option-height) * 5));
    overflow: auto;
    color: var(--sui-tree-foreground-color, var(--sui-control-foreground-color));
    background-color: var(--sui-tree-background-color);
    font-family: var(--sui-control-font-family);
    font-size: var(--sui-control-font-size);
    line-height: var(--sui-control-line-height);
  }

  .inner {
    display: contents;
  }
</style>
