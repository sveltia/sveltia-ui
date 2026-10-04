<!--
  @component
  The layout container of `<Checkbox>`es.
-->
<script>
  import { _ } from '@sveltia/i18n';

  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {boolean} [hidden] Whether to hide the widget. An alias of the `aria-hidden`
   * attribute.
   * @property {boolean} [disabled] Whether to disable the widget. An alias of the `aria-disabled`
   * attribute.
   * @property {'horizontal'|'vertical'} [orientation] Orientation of the widget.
   * @property {string} [ariaLabel] The `aria-label` attribute on the wrapper element.
   * @property {Snippet} [children] Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
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
