<!--
  @component
  The shared base of `<RadioGroup>` and `<SelectButtonGroup>`: a `radiogroup` wrapper managing the
  selection of its children. The wrappers give the class names and style the element, so their
  styles have to be global. Not exported.
  @see https://w3c.github.io/aria/#radiogroup
  @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script>
  import { activateGroup } from '../../services/group.svelte.js';
  import { getAccessibleName, getWidgetStateAttrs } from '../../services/label.js';

  /**
   * @import { ClassValue } from 'svelte/elements';
   * @import { ContainerProps, FormFieldStateProps, WidgetStateProps } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {ClassValue} [class] The `class` attribute on the wrapper element, given in full by
   * the wrapper component, as a string or a `clsx`-style array.
   * @property {'horizontal'|'vertical'} [orientation] Orientation of the widget. An alias of the
   * `aria-orientation` attribute, which is left out if not given.
   * @property {string} [ariaLabel] The `aria-label` attribute on the wrapper element.
   * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler.
   */

  /**
   * @type {Omit<ContainerProps, 'class'> & WidgetStateProps & FormFieldStateProps & Props &
   * Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    hidden = false,
    disabled = false,
    readonly = false,
    required = false,
    invalid = false,
    orientation = undefined,
    ariaLabel = undefined,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div
  {...restProps}
  role="radiogroup"
  class={className}
  tabindex="-1"
  {hidden}
  {...getWidgetStateAttrs({ hidden, disabled, readonly, required, invalid })}
  aria-orientation={orientation}
  aria-label={getAccessibleName({ ariaLabel, props: restProps })}
  {@attach activateGroup()}
>
  <div role="none" class="inner" inert={disabled}>
    {@render children?.()}
  </div>
</div>

<style lang="scss">
  .inner {
    display: contents;
  }
</style>
