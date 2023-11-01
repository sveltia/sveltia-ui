<!--
  @component
  A menu item group.
-->
<script>
  import { getRandomId } from '../util/util';

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
  {id}
  class="sui menu-item-group {className}"
  {hidden}
  role="group"
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-labelledby={title ? '{id}-title' : undefined}
  {...$$restProps}
>
  {#if title}
    <div class="title" id="{id}-title">{title}</div>
  {/if}
  <div class="inner" inert={disabled}>
    <slot />
  </div>
</div>

<style lang="scss">
  .inner {
    display: contents;
  }
</style>
