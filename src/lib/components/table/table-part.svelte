<!--
  @component
  The row group, row or cell behind the leaf components of `<Table>` and `<Grid>`, which only differ
  in their role, class name and `display`. Internal; not exported.
-->
<script>
  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {'head' | 'foot' | 'row' | 'col-header' | 'row-header' | 'cell'} PartName
   */

  /**
   * @typedef {object} Props
   * @property {string} role The `role` attribute on the wrapper element.
   * @property {`table-${PartName}` | `grid-${PartName}`} kind The component class name, which also
   * determines the `display` style.
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {Snippet} [children] Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    role,
    kind,
    class: className,
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<div {...restProps} {role} class="sui {kind} {className}">
  {@render children?.()}
</div>

<style lang="scss">
  .table-head,
  .grid-head {
    display: table-header-group;
  }

  .table-foot,
  .grid-foot {
    display: table-footer-group;
  }

  .table-row,
  .grid-row {
    display: table-row;
    height: var(--sui-primary-row-height);
  }

  .table-col-header,
  .grid-col-header,
  .table-cell,
  .grid-cell {
    display: table-cell;
  }

  .table-row-header,
  .grid-row-header {
    display: table-cell;
    height: var(--sui-secondary-row-height);
  }
</style>
