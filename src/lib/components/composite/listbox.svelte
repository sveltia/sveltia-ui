<!--
  @component
  @see https://w3c.github.io/aria/#listbox
  @see https://w3c.github.io/aria-practices/#Listbox
-->
<svelte:options accessors={true} />

<script>
  import { activateGroup } from '../helpers/group';

  /**
   * CSS class name on the button.
   * @type {String}
   */
  let className = '';

  export { className as class };

  /** @type {(HTMLElement|undefined)} */
  export let element = undefined;

  export let multiple = false;
</script>

<div
  class="sui listbox {className}"
  role="listbox"
  tabindex="0"
  aria-multiselectable={multiple}
  {...$$restProps}
  bind:this={element}
  on:click
  on:select
  use:activateGroup
>
  <slot />
</div>

<style lang="scss">
  [role='listbox'] {
    display: flex;
    flex-direction: column;
    color: inherit;
    margin: 0;
    border-width: 1px;
    border-color: var(--control-border-color);
    border-radius: 4px;
    padding: 4px;

    :global([role='separator']) {
      margin: 4px;
    }

    :global([role='group']) {
      &:not(:first-child) {
        margin-top: 16px;
      }

      &:not(:last-child) {
        margin-bottom: 16px;
      }

      :global(.title) {
        margin: 0 8px 8px;
        color: var(--secondary-foreground-color);
        font-size: 11px;
        text-transform: uppercase;
      }
    }
  }
</style>
