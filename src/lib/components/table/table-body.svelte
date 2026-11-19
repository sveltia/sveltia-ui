<!--
  @component
  The equivalent of the HTML `<tbody>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody
  @see https://w3c.github.io/aria/#rowgroup
-->
<script>
  import { _ } from '@sveltia/i18n';

  /**
   * @import { ContainerProps } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {string} [label] Display label for the row group.
   */

  /**
   * @type {ContainerProps & Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    label = '',
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();
</script>

<div
  {...restProps}
  role="rowgroup"
  class="sui table-body row-group {className}"
  aria-labelledby={label ? `${id}-label` : undefined}
  aria-roledescription={_('_sui.role_descriptions.table_body')}
>
  {#if label}
    <div role="row" class="row-group-caption">
      <!-- We need `colspan` here but cannot place `<th>` under `<div>`, so use a hack -->
      <svelte:element this={'th'} role="columnheader" id="{id}-label" colspan="9999">
        {label}
      </svelte:element>
    </div>
  {/if}
  {@render children?.()}
</div>

<style lang="scss">
  @use '../../styles/mixins';

  @include mixins.row-group;
</style>
