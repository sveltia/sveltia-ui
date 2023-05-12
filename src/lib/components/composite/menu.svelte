<!--
  @component
  @see https://w3c.github.io/aria/#menu
  @see https://w3c.github.io/aria-practices/#menu
-->
<svelte:options accessors={true} />

<script>
  import { activateGroup } from '../helpers/group';

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
    border-color: var(--secondary-border-color);
    border-radius: 4px;
    padding: 4px;

    :global([role='separator']) {
      margin: 4px;
    }
  }
</style>
