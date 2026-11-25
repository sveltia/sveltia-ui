<!--
  @component
  The container of `<Radio>`s.
  @see https://w3c.github.io/aria/#radiogroup
  @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script>
  import RadioGroupBase from './radio-group-base.svelte';

  /**
   * @import { ContainerProps, FormFieldStateProps, WidgetStateProps } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {'horizontal'|'vertical'} [orientation] Orientation of the widget. An alias of the
   * `aria-orientation` attribute.
   * @property {string} [ariaLabel] The `aria-label` attribute on the wrapper element.
   * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler.
   */

  /**
   * @type {ContainerProps & WidgetStateProps & FormFieldStateProps & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    orientation = 'horizontal',
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<RadioGroupBase {...restProps} class={['sui', 'radio-group', className, orientation]} {orientation}>
  {@render children?.()}
</RadioGroupBase>

<style lang="scss">
  @use '../../styles/mixins';

  // The element is rendered by the base, so the styles have to be global
  :global {
    .sui.radio-group {
      display: inline-flex;

      &:focus-visible {
        outline-width: 0 !important;
      }

      @include mixins.toggle-group-orientation;

      &[aria-invalid='true'] button {
        border-color: var(--sui-error-border-color);

        &[aria-checked='true'] {
          border-color: var(--sui-error-border-color);

          &::before {
            background-color: var(--sui-error-border-color);
          }
        }
      }
    }
  }
</style>
