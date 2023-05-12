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
  role="grid"
  class="sui grid {className}"
  {...$$restProps}
  bind:this={element}
  use:activateGroup
>
  <slot />
</div>
