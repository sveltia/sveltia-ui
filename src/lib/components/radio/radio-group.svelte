<!--
  @component
  The container of `<Radio>`s.
  @see https://w3c.github.io/aria/#radiogroup
  @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script>
  import { activateGroup } from '../../services/group.svelte.js';

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
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    orientation = 'horizontal',
    ariaLabel = undefined,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div
  {...restProps}
  role="radiogroup"
  class={['sui', 'radio-group', className, orientation]}
  tabindex="-1"
  {hidden}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-readonly={readonly}
  aria-required={required}
  aria-invalid={invalid}
  aria-orientation={orientation}
  aria-label={ariaLabel}
  {@attach activateGroup()}
>
  <div role="none" class="inner" inert={disabled}>
    {@render children?.()}
  </div>
</div>

<style lang="scss">
  @use '../../styles/mixins';

  .radio-group {
    display: inline-flex;

    &:focus-visible {
      outline-width: 0 !important;
    }

    @include mixins.toggle-group-orientation;

    &[aria-invalid='true'] :global {
      button {
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

  .inner {
    display: contents;
  }
</style>
