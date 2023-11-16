<!--
  @component
  A menu item group.
-->
<script>
  import { getRandomId } from '../../services/util';

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
   *  Text label displayed above the group items.
   */
  export let title = '';

  const id = getRandomId('group');
</script>

<div
  role="group"
  {id}
  class="sui menu-item-group {className}"
  hidden={hidden || undefined}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-labelledby={title ? '{id}-title' : undefined}
  aria-roledescription="menu item group"
  {...$$restProps}
>
  {#if title}
    <div role="none" class="title" id="{id}-title">{title}</div>
  {/if}
  <div role="none" class="inner" inert={disabled}>
    <slot />
  </div>
</div>

<style lang="scss">
  .inner {
    display: contents;
  }
</style>
