<!--
  @component
  The equivalent of the HTML `<th scope="col">` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th
  @see https://w3c.github.io/aria/#columnheader
-->
<script>
  import TablePart from './table-part.svelte';

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

<TablePart {...restProps} role="columnheader" kind="table-col-header" />
