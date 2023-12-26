<!--
  @component
  A variant of `<RadioGroup>`, looking like normal buttons.
  @see https://w3c.github.io/aria/#radiogroup
  @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
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
   * Whether to hide the widget.
   * @type {boolean | undefined}
   */
  export let hidden = undefined;
  /**
   * Whether to disable the widget. An alias of the `aria-disabled` attribute.
   * @type {boolean}
   */
  export let disabled = false;
  /**
   * Whether to make the widget read-only. An alias of the `aria-readonly` attribute.
   * @type {boolean}
   */
  export let readonly = false;
  /**
   * Whether to mark the widget required. An alias of the `aria-required` attribute.
   * @type {boolean}
   */
  export let required = false;
  /**
   * Whether to mark the widget invalid. An alias of the `aria-invalid` attribute.
   * @type {boolean}
   */
  export let invalid = false;

  const dispatch = createEventDispatcher();
</script>

<div
  role="radiogroup"
  class="sui select-button-group {className}"
  hidden={hidden || undefined}
  tabindex="-1"
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-readonly={readonly}
  aria-required={required}
  aria-invalid={invalid}
  {...$$restProps}
  use:activateGroup
  on:change={(/** @type {CustomEvent} */ event) => dispatch('change', event)}
>
  <div role="none" class="inner" inert={disabled}>
    <slot />
  </div>
</div>

<style lang="scss">
  .select-button-group {
    display: inline-flex;
    align-items: center;
    margin: var(--sui-focus-ring-width);

    &:focus-visible {
      outline-width: 0 !important;
    }

    :global(button) {
      margin: 0 !important;
      border-radius: 0;
      color: var(--sui-primary-foreground-color);

      &:first-child {
        border-top-left-radius: 4px !important;
        border-bottom-left-radius: 4px;
      }

      &:not(:first-child) {
        border-left-width: 0;
      }

      &:last-child {
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
      }
    }

    :global(button[aria-checked='true']) {
      color: var(--sui-highlight-foreground-color);
      background-color: var(--sui-selected-background-color);
    }

    // Maintain the border opacity
    &[aria-disabled='false'] {
      :global(button[aria-disabled='true']) {
        filter: grayscale(0) opacity(1);

        :global(*) {
          filter: grayscale(1) opacity(0.35);
        }
      }
    }
  }

  .inner {
    display: contents;
  }
</style>
