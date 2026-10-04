<!--
  @component
  A menu item group.
-->
<script>
  import { _ } from '@sveltia/i18n';

  /**
   * @import { CommonEventHandlers } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] Whether to hide the widget. An alias of the `aria-hidden`
   * attribute.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {string} [label] Text label displayed above the group items.
   * @property {string} [title] Deprecated: use `label` instead.
   */

  /**
   * @type {CommonEventHandlers & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    hidden = false,
    disabled = false,
    label = '',
    title = '',
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();
  const groupLabel = $derived(label || title);
</script>

<div
  {...restProps}
  role="group"
  {id}
  class="sui menu-item-group {className}"
  {hidden}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-labelledby={groupLabel ? `${id}-title` : undefined}
  aria-roledescription={_('_sui.role_descriptions.menu_item_group')}
>
  {#if groupLabel}
    <div role="none" class="title" id="{id}-title">{groupLabel}</div>
  {/if}
  <div role="none" class="inner" inert={disabled}>
    {@render children?.()}
  </div>
</div>

<style lang="scss">
  .inner {
    display: contents;
  }
</style>
