<!--
  @component
  The interactive version of `<TableCell>`.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td
  @see https://w3c.github.io/aria/#gridcell
-->
<script>
  import TablePart from '../table/table-part.svelte';

  /**
   * @import { ContainerProps } from '#lib/typedefs.js';
   */

  /**
   * @type {ContainerProps & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<TablePart {...restProps} role="gridcell" kind="grid-cell" />
