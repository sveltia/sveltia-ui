<!--
  @component
  The layout container of `<Checkbox>`es.
-->
<script>
  import { _ } from '@sveltia/i18n';

  /**
   * @import { ContainerProps, WidgetStateProps } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {'horizontal'|'vertical'} [orientation] Orientation of the widget.
   * @property {string} [ariaLabel] The `aria-label` attribute on the wrapper element.
   */

  /**
   * @type {ContainerProps & WidgetStateProps & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    hidden = false,
    disabled = false,
    orientation = 'horizontal',
    ariaLabel = undefined,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div
  {...restProps}
  role="group"
  class={['sui', 'checkbox-group', className, orientation]}
  {hidden}
  aria-hidden={hidden}
  aria-disabled={disabled}
  aria-roledescription={_('_sui.role_descriptions.checkbox_group')}
  aria-label={ariaLabel}
>
  <div role="none" class="inner" inert={disabled}>
    {@render children?.()}
  </div>
</div>

<style lang="scss">
  @use '../../styles/mixins';

  .checkbox-group {
    display: inline-flex;

    @include mixins.toggle-group-orientation;
  }

  .inner {
    display: contents;
  }
</style>
