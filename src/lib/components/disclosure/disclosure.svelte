<!--
  @component
  A disclosure (expander) widget. The equivalent of the HTML `<details>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details
  @see https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
-->
<script>
  import Button from '../button/button.svelte';
  import Icon from '../icon/icon.svelte';

  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] Whether to hide the widget. An alias of the `aria-hidden`
   * attribute.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [expanded] Whether to show the content. An alias of the `aria-expanded`
   * attribute.
   * @property {string} [label] Text label displayed next to the expander.
   * @property {Snippet} [children] Primary slot content.
   * @property {Snippet} [chevronIcon] Chevron slot content.
   * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    expanded = $bindable(false),
    class: className,
    hidden = false,
    disabled = false,
    label = '',
    children,
    chevronIcon,
    onChange,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();
</script>

<div
  {...restProps}
  role="group"
  {id}
  class="sui disclosure {className}"
  {hidden}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-labelledby="{id}-header"
  aria-roledescription="disclosure"
>
  <div role="none" class="inner" inert={disabled}>
    <Button
      class="header"
      id="{id}-header"
      {disabled}
      aria-controls="{id}-content"
      aria-expanded={expanded}
      onclick={() => {
        expanded = !expanded;
        onChange?.(new CustomEvent('change', { detail: { expanded } }));
      }}
    >
      {#snippet startIcon()}
        {#if chevronIcon}
          {@render chevronIcon()}
        {:else}
          <Icon name="expand_more" />
        {/if}
      {/snippet}
      {label}
    </Button>
    <div class="content" id="{id}-content" hidden={!expanded}>
      {@render children?.()}
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
