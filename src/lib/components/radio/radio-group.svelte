<!--
  @component
  The container of `<Radio>`s.
  @see https://w3c.github.io/aria/#radiogroup
  @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script>
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
  /**
   * Orientation of the widget. An alias of the `aria-orientation` attribute.
   * @type {'horizontal' | 'vertical'}
   */
  export let orientation = 'horizontal';
</script>

<div
  role="radiogroup"
  class="sui radio-group {className} {orientation}"
  tabindex="-1"
  hidden={hidden || undefined}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-readonly={readonly}
  aria-required={required}
  aria-invalid={invalid}
  aria-orientation={orientation}
  {...$$restProps}
  use:activateGroup
  on:change
>
  <div role="none" class="inner" inert={disabled}>
    <slot />
  </div>
</div>

<style lang="scss">
  .radio-group {
    display: inline-flex;

    &:focus-visible {
      outline-width: 0 !important;
    }

    &.horizontal {
      gap: 16px;
      align-items: center;
    }

    &.vertical {
      gap: 8px;
      flex-direction: column;

      @media (pointer: coarse) {
        gap: 16px;
      }
    }
  }

  .inner {
    display: contents;
  }
</style>
