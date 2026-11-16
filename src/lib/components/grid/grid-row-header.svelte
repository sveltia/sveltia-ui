<!--
  @component
  The interactive version of `<TableRowHeader>`.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th
  @see https://w3c.github.io/aria/#rowheader
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

<TablePart {...restProps} role="rowheader" kind="grid-row-header" />
