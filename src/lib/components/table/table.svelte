<!--
  @component
  The equivalent of the HTML `<table>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table
  @see https://w3c.github.io/aria/#grid
-->
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
  role="grid"
  class="sui table {className}"
  {...$$restProps}
  bind:this={element}
  use:activateGroup
>
  <slot />
</div>
