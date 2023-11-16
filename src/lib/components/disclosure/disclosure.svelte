<!--
  @component
  A disclosure (expander) widget. The equivalent of the HTML `<details>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details
  @see https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
-->
<svelte:options accessors={true} />

<script>
  import { getRandomId } from '../../services/util';
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';

  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };
  /**
   * Whether to hide the widget. An alias of the `aria-hidden` attribute.
   * @type {boolean | undefined}
   */
  export let hidden = undefined;
  /**
   * Whether to disable the widget. An alias of the `aria-disabled` attribute.
   * @type {boolean}
   */
  export let disabled = false;
  /**
   * Whether to show the content. An alias of the `aria-expanded` attribute.
   * @type {boolean}
   */
  export let expanded = false;
  /**
   * Text label displayed next to the expander.
   * @type {string}
   */
  export let label = '';

  const id = getRandomId('disclosure');
</script>

<div
  role="group"
  {id}
  class="sui disclosure {className}"
  hidden={hidden || undefined}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-labelledby="{id}-header"
  aria-roledescription="disclosure"
  {...$$restProps}
>
  <div role="none" class="inner" inert={disabled}>
    <Button
      class="header"
      id="{id}-header"
      {disabled}
      aria-controls="{id}-content"
      aria-expanded={expanded}
      on:click={() => {
        expanded = !expanded;
      }}
    >
      <Icon name="expand_more" />
      {label}
    </Button>
    <div class="content" id="{id}-content" hidden={!expanded}>
      <slot />
    </div>
  </div>
</div>

<style lang="scss">
  .disclosure {
    :global(button) {
      display: flex;
      width: 100%;
    }

    :global(button .icon) {
      transition: all 200ms;
    }

    :global(button[aria-expanded='false'] .icon) {
      transform: rotate(-90deg);
    }
  }

  .inner {
    display: contents;
  }

  .content {
    &[hidden] {
      display: block;
      overflow: hidden;
      height: 0;
    }
  }
</style>
