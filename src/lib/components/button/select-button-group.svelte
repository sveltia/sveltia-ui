<!--
  @component
  A variant of `<RadioGroup>`, looking like normal buttons.
  @see https://w3c.github.io/aria/#radiogroup
  @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script>
  import RadioGroupBase from '../radio/radio-group-base.svelte';

  /**
   * @import { ContainerProps, FormFieldStateProps, WidgetStateProps } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {string} [ariaLabel] The `aria-label` attribute on the wrapper element.
   * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler.
   */

  /**
   * @type {ContainerProps & WidgetStateProps & FormFieldStateProps & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<RadioGroupBase {...restProps} class="sui select-button-group {className}">
  {@render children?.()}
</RadioGroupBase>

<style lang="scss">
  // The element is rendered by the base, so the styles have to be global
  :global {
    .sui.select-button-group {
      flex: none;
      display: inline-flex;
      align-items: center;
      margin: var(--sui-focus-ring-width);

      &:focus-visible {
        outline-width: 0 !important;
      }

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

      &[aria-invalid='true'] button {
        border-color: var(--sui-error-border-color);
      }

      // Maintain the border opacity
      &[aria-disabled='false'] button[aria-disabled='true'] {
        filter: grayscale(0) opacity(1);

        * {
          filter: grayscale(1) opacity(var(--sui-disabled-opacity, 0.35));
        }
      }

      // Pointing at a button in a read-only group gives no feedback, so it doesn’t look editable.
      // Each button variant has its own hover and active colours, so the pointer is turned away
      // instead of undoing them one by one; the labels aren’t selectable text anyway.
      &[aria-readonly='true'] button {
        pointer-events: none;
      }
    }
  }
</style>
