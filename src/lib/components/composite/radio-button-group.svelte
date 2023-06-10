<!--
  @component
  The container of `<RadioButton>`s.
  @see https://w3c.github.io/aria/#radiogroup
  @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script>
  import { activateGroup } from '../helpers/group';

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
  class="sui radio-button-group {className} {orientation}"
  role="radiogroup"
  tabindex="0"
  bind:this={element}
  on:select
  use:activateGroup
>
  <slot />
</div>

<style lang="scss">
  .radio-button-group {
    display: inline-flex;

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
