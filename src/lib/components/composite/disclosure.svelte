<!--
  @component
  @see https://w3c.github.io/aria-practices/#disclosure
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details
-->
<script>
  import Button from '../core/button.svelte';
  import Icon from '../core/icon.svelte';
  import { getRandomId } from '../helpers/util';

  /**
   * CSS class name on the button.
   * @type {String}
   */
  let className = '';

  export { className as class };

  export let label = '';

  export let expanded = false;

  const id = getRandomId('disclosure');
</script>

<div class="sui disclosure {className}" {id} role="group" aria-labelledby="{id}-header">
  <Button
    class="header"
    id="{id}-header"
    aria-controls="{id}-content"
    aria-expanded={expanded}
    on:click={() => {
      expanded = !expanded;
    }}
  >
    <Icon name="expand_more" />
    {label}
  </Button>
  <div class="content" id="{id}-content" hidden={!expanded ? 'hidden' : undefined}>
    <slot />
  </div>
</div>

<style lang="scss">
  .disclosure {
    :global(button) {
      display: flex;
      width: 100%;
      justify-content: space-between;
    }

    :global(button .icon) {
      transition: all 200ms;
    }

    :global(button[aria-expanded='false'] .icon) {
      transform: rotate(-90deg);
    }
  }

  .content {
    &[hidden] {
      display: block;
      overflow: hidden;
      height: 0;
    }
  }
</style>
