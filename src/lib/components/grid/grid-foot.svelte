<!--
  @component
  The interactive version of `<TableFoot>`.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot
  @see https://w3c.github.io/aria/#rowgroup
-->
<script>
  import { _ } from '@sveltia/i18n';
  import { setContext } from 'svelte';
  import TablePart from '../table/table-part.svelte';

  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {Snippet} [children] Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  // Tell the `<GridRow>`s inside that they are footer rows, such as a totals row, which can be
  // focused but not selected, like header rows
  setContext('sui:grid-unselectable-rows', true);
</script>

<TablePart
  {...restProps}
  role="rowgroup"
  kind="grid-foot"
  aria-roledescription={_('_sui.role_descriptions.grid_foot')}
/>
