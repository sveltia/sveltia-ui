<!--
  @component
  The container of `<RadioButton>`s.
  @see https://w3c.github.io/aria/#radiogroup
  @see https://w3c.github.io/aria-practices/#radiobutton
-->
<script>
  import { activateGroup } from '../helpers/group';

  /**
   * CSS class name on the button.
   * @type {String}
   */
  let className = '';

  export { className as class };

  /** @type {('horizontal'|'vertical')} */
  export let orientation = 'horizontal';

  /** @type {(HTMLElement|undefined)} */
  export let element = undefined;
</script>

<div
  class="sui radio-button-group {className} {orientation}"
  role="radiogroup"
  bind:this={element}
  use:activateGroup
>
  <slot />
</div>

<style lang="scss">
  .radio-button-group {
    display: inline-flex;
    align-items: center;
    gap: 16px;

    &.horizontal {
      align-items: center;
    }

    &.vertical {
      flex-direction: column;
    }
  }
</style>
