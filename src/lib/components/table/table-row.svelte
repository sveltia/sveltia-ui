<!--
  @component
  The equivalent of the HTML `<tr>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr
  @see https://w3c.github.io/aria/#row
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

<TablePart {...restProps} role="row" kind="table-row" />
