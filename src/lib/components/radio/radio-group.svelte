<!--
  @component
  The container of `<Radio>`s.
  @see https://w3c.github.io/aria/#radiogroup
  @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script>
  import { activateGroup } from '../util/group';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  /** @type {('horizontal'|'vertical')} */
  export let orientation = 'horizontal';

  /** @type {HTMLElement?} */
  export let element = undefined;
</script>

<div
  class="sui radio-group {className} {orientation}"
  tabindex="-1"
  role="radiogroup"
  aria-orientation={orientation}
  bind:this={element}
  on:select
  use:activateGroup
>
  <slot />
</div>

<style lang="scss">
  .radio-group {
    display: inline-flex;

    &:focus-visible {
      outline-width: 0 !important;
    }

    &.horizontal {
      gap: 16px;
      align-items: center;
    }

    &.vertical {
      gap: 8px;
      flex-direction: column;
    }
  }
</style>
