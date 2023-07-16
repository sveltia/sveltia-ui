<!--
  @component
  A menu widget.
  @see https://w3c.github.io/aria/#menu
  @see https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
-->
<svelte:options accessors={true} />

<script>
  import { activateGroup } from '../util/group';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  /** @type {HTMLElement?} */
  export let element = undefined;
</script>

<div
  class="sui menu {className}"
  role="menu"
  {...$$restProps}
  bind:this={element}
  use:activateGroup
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
