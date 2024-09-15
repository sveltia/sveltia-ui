<!--
  @component
  The container of `<Radio>`s.
  @see https://w3c.github.io/aria/#radiogroup
  @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script>
  import { activateGroup } from '../../services/group.svelte';

  /**
   * @typedef {object} Props
   * @property {string} [class] - The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] - Whether to hide the widget.
   * @property {boolean} [disabled] - Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {boolean} [readonly] - Whether to make the widget read-only. An alias of the
   * `aria-readonly` attribute.
   * @property {boolean} [required] - Whether to mark the widget required. An alias of the
   * `aria-required` attribute.
   * @property {boolean} [invalid] - Whether to mark the widget invalid. An alias of the
   * `aria-invalid` attribute.
   * @property {'horizontal'|'vertical'} [orientation] - Orientation of the widget. An alias of the
   * `aria-orientation` attribute.
   * @property {import('svelte').Snippet} [children] - Primary slot content.
   * @property {(event: CustomEvent) => void} [onChange] - Custom `Change` event handler.
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
    orientation = 'horizontal',
    children,
    onChange,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div
  {...restProps}
  role="radiogroup"
  class="sui radio-group {className} {orientation}"
  tabindex="-1"
  {hidden}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-readonly={readonly}
  aria-required={required}
  aria-invalid={invalid}
  aria-orientation={orientation}
  {onChange}
  use:activateGroup
>
  <div role="none" class="inner" inert={disabled}>
    {@render children?.()}
  </div>
</div>

<style lang="scss">
  .radio-group {
    display: inline-flex;

    &:focus-visible {
      outline-width: 0 !important;
    }

    &.horizontal {
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    &.vertical {
      gap: 4px;
      flex-direction: column;

      @media (pointer: coarse) {
        gap: 8px;
      }
    }
  }

  .inner {
    display: contents;
  }
</style>
