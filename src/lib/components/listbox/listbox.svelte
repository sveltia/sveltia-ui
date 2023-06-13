<!--
  @component
  A list widget with selectable options. The equivalent of the HTML `<select multiple>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
  @see https://w3c.github.io/aria/#listbox
  @see https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
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
    border-color: var(--secondary-control-border-color);
    border-radius: 4px;
    padding: 4px;

    :global([role='separator']) {
      margin: 4px;
    }

    &:global(.tabs) {
      padding: 0;
      border-width: 0 1px 0 0;
      border-color: var(--secondary-control-border-color);
      min-width: 160px;

      :global(.option button) {
        justify-content: flex-start;
        border-width: 0 2px 0 0;
        border-color: transparent;
        padding: 0 12px;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        height: var(--tab--medium--height);

        :global(.icon) {
          display: none;
        }
      }

      :global(.option button[aria-selected='true']) {
        border-color: var(--primary-accent-color-lighter);
      }
    }
  }
</style>
