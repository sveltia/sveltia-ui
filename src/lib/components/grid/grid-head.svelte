<!--
  @component
  The interactive version of `<TableHead>`.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead
  @see https://w3c.github.io/aria/#rowgroup
-->
<script>
  import { _ } from '@sveltia/i18n';
  import { setContext } from 'svelte';
  import TablePart from '../table/table-part.svelte';
  import { UNSELECTABLE_ROWS_KEY } from './grid.js';

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

  // Tell the `<GridRow>`s inside that they are header rows, which can be focused but not selected
  setContext(UNSELECTABLE_ROWS_KEY, true);
</script>

<TablePart
  {...restProps}
  role="rowgroup"
  kind="grid-head"
  aria-roledescription={_('_sui.role_descriptions.grid_head')}
/>
