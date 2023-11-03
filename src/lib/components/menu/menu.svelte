<!--
  @component
  A menu widget.
  @see https://w3c.github.io/aria/#menu
  @see https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
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
</script>

<div
  class="sui menu {className}"
  role="menu"
  hidden={hidden || undefined}
  aria-hidden={hidden}
  aria-disabled={disabled}
  {...$$restProps}
  use:activateGroup
  on:change
>
  <slot />
</div>

<style lang="scss">
  .menu {
    display: flex;
    flex-direction: column;
    margin: 0;
    border-width: 1px;
    border-color: var(--sui-secondary-border-color);
    border-radius: 4px;
    padding: 4px;

    :global([role='separator']) {
      margin: 4px;
    }
  }
</style>
