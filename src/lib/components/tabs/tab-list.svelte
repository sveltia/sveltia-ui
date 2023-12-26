<!--
  @component
  A tab list widget.
  @see https://w3c.github.io/aria/#tablist
  @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import { activateGroup } from '../../services/group';

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
   * Orientation of the widget. An alias of the `aria-orientation` attribute.
   * @type {'horizontal' | 'vertical'}
   */
  export let orientation = 'horizontal';
  /**
   * The `data-name` attribute on the wrapper element.
   * @type {string | undefined}
   */
  export let name = undefined;

  const dispatch = createEventDispatcher();
</script>

<div
  role="tablist"
  class="sui tab-list {className}"
  hidden={hidden || undefined}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-orientation={orientation}
  data-name={name || undefined}
  {...$$restProps}
  use:activateGroup
  on:change={(/** @type {CustomEvent} */ event) => dispatch('change', event)}
>
  <div role="none" class="inner" inert={disabled}>
    <slot />
  </div>
</div>

<style lang="scss">
  .tab-list {
    display: flex;
    align-items: center;
    margin: var(--sui-focus-ring-width);
    border-color: var(--sui-control-border-color);

    &[aria-orientation='horizontal'] {
      gap: 8px;
      margin-bottom: 32px;
      border-width: 0 0 1px;
      padding: 0 16px;

      :global(button) {
        border-width: 0 0 2px 0;
      }
    }

    &[aria-orientation='vertical'] {
      gap: 8px;
      flex-direction: column;
      margin-right: 32px;
      border-width: 0 1px 0 0;
      padding: 8px 0;
      width: 240px;

      :global(button) {
        border-width: 0 2px 0 0;
        width: 100%;
      }
    }

    :global(button) {
      justify-content: flex-start;
      border-color: transparent;
      margin: 0 !important;
      padding: 0;
      border-radius: 0;
      height: var(--sui-tab-medium-height);
    }

    :global(button[aria-selected='true']) {
      border-color: var(--sui-primary-accent-color-light);
    }
  }

  .inner {
    display: contents;
  }
</style>
