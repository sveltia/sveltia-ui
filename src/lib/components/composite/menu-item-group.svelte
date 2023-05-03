<script>
  import { getRandomId } from '../helpers/util';

  /**
   * CSS class name on the button.
   * @type {string}
   */
  let className = '';

  export { className as class };

  export let title = '';

  export let ariaLabel = '';

  const id = getRandomId('group');
</script>

<div
  class="sui menu-item-group {className}"
  role="group"
  {id}
  aria-label={ariaLabel || undefined}
  aria-labelledby={title ? '{id}-title' : undefined}
  {...$$restProps}
>
  {#if title}
    <div class="title" id="{id}-title">{title}</div>
  {/if}
  <slot />
</div>
