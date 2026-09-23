<!--
  @component
  A variant of `<RadioGroup>`, looking like normal buttons.
  @see https://w3c.github.io/aria/#radiogroup
  @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script>
  import { activateGroup } from '../../services/group.svelte.js';

  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] Whether to hide the widget.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [readonly] Whether to make the widget read-only. An alias of the
   * `aria-readonly` attribute.
   * @property {boolean} [required] Whether to mark the widget required. An alias of the
   * `aria-required` attribute.
   * @property {boolean} [invalid] Whether to mark the widget invalid. An alias of the
   * `aria-invalid` attribute.
   * @property {string} [ariaLabel] The `aria-label` attribute on the wrapper element.
   * @property {Snippet} [children] Primary slot content.
   * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    ariaLabel = undefined,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div
  {...restProps}
  role="radiogroup"
  class="sui select-button-group {className}"
  {hidden}
  tabindex="-1"
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-readonly={readonly}
  aria-required={required}
  aria-invalid={invalid}
  aria-label={ariaLabel}
  {@attach activateGroup()}
>
  <div role="none" class="inner" inert={disabled}>
    {@render children?.()}
  </div>
</div>

<style lang="scss">
  .select-button-group {
    flex: none;
    display: inline-flex;
    align-items: center;
    margin: var(--sui-focus-ring-width);

    &:focus-visible {
      outline-width: 0 !important;
    }

    :global {
      button {
        margin: 0 !important;
        border-radius: 0 !important;
        color: var(--sui-primary-foreground-color);

        &:first-child {
          border-start-start-radius: 4px !important;
          border-end-start-radius: 4px !important;
        }

        &:not(:first-child) {
          border-inline-start-width: 0;
        }

        &:last-child {
          border-start-end-radius: 4px !important;
          border-end-end-radius: 4px !important;
        }

        &[aria-checked='true'] {
          color: var(--sui-highlight-foreground-color);
          background-color: var(--sui-selected-background-color);
        }
      }
    }

    &[aria-invalid='true'] :global(button) {
      border-color: var(--sui-error-border-color);
    }

    // Maintain the border opacity
    &[aria-disabled='false'] :global(button[aria-disabled='true']) {
      filter: grayscale(0) opacity(1);

      :global(*) {
        filter: grayscale(1) opacity(var(--sui-disabled-opacity, 0.35));
      }
    }

    // Pointing at a button in a read-only group gives no feedback, so it doesn’t look editable.
    // Each button variant has its own hover and active colours, so the pointer is turned away
    // instead of undoing them one by one; the labels aren’t selectable text anyway.
    &[aria-readonly='true'] :global(button) {
      pointer-events: none;
    }
  }

  .inner {
    display: contents;
  }
</style>
