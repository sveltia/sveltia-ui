<!--
  @component
  A disclosure (expander) widget. The equivalent of the HTML `<details>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details
  @see https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
-->
<script>
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';
  import { getRandomId } from '../util/util';

  /**
   * CSS class name on the button.
   * @type {string}
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
  <div class="content" id="{id}-content" hidden={!expanded ? true : undefined}>
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
