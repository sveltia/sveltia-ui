<!--
  @component
  @see https://w3c.github.io/aria/#tablist
  @see https://w3c.github.io/aria-practices/#tabpanel
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

  /** @type {(HTMLElement|undefined)} */
  export let element = undefined;

  /** @type {('horizontal'|'vertical')} */
  export let orientation = 'horizontal';

  export let name = '';
</script>

<div
  class="sui tab-list {className}"
  role="tablist"
  aria-orientation={orientation}
  data-name={name || undefined}
  {...$$restProps}
  bind:this={element}
  on:select
  use:activateGroup
>
  <slot />
</div>

<style lang="scss">
  .tab-list {
    display: flex;
    align-items: center;
    border-color: var(--control-border-color);

    &[aria-orientation='horizontal'] {
      gap: 16px;
      margin: 0 0 32px;
      border-width: 0 0 1px;
      padding: 0 16px;

      :global(button) {
        border-width: 0 0 2px 0;
      }
    }

    &[aria-orientation='vertical'] {
      gap: 8px;
      flex-direction: column;
      margin: 0 32px 0 0;
      border-width: 0 1px 0 0;
      padding: 8px 0;
      width: 240px;

      :global(button) {
        border-width: 0 2px 0 0;
        width: 100%;
      }
    }

    :global(button) {
      justify-content: flex-start;
      border-color: transparent;
      padding: 0;
      border-radius: 0;
      height: var(--tab--medium--height);
    }

    :global(button[aria-selected='true']) {
      border-color: var(--primary-accent-color-lighter);
    }
  }
</style>
