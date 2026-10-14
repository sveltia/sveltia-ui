<!--
  @component
  Test fixture: a `<Grid>` with a few selectable rows, optionally below a header row.
-->
<script>
  import GridBody from './grid-body.svelte';
  import GridCell from './grid-cell.svelte';
  import GridColHeader from './grid-col-header.svelte';
  import GridFoot from './grid-foot.svelte';
  import GridHead from './grid-head.svelte';
  import GridRow from './grid-row.svelte';
  import Grid from './grid.svelte';

  /**
   * @type {{
   * multiple?: boolean,
   * clickToSelect?: boolean,
   * values?: string[],
   * withButtons?: boolean,
   * label?: string,
   * collapsible?: boolean,
   * withHead?: boolean,
   * withFoot?: boolean,
   * headerRowProps?: Record<string, any>,
   * sortOrder?: 'ascending' | 'descending' | 'none',
   * onSort?: (event: CustomEvent<{ sortOrder: 'ascending' | 'descending' }>) => void,
   * onChange?: (event: CustomEvent) => void,
   * }}
   */
  const {
    multiple = false,
    clickToSelect = true,
    values = ['a', 'b', 'c'],
    withButtons = false,
    label = '',
    collapsible = false,
    withHead = false,
    withFoot = false,
    headerRowProps = {},
    sortOrder = undefined,
    onSort = undefined,
    onChange = undefined,
  } = $props();

  /** @type {Record<string, string>} */
  const labels = { a: 'Alpha', b: 'Beta', c: 'Gamma', d: 'Delta', e: 'Epsilon' };
</script>

<Grid ariaLabel="Files" {multiple} {clickToSelect} {onChange}>
  {#if withHead}
    <GridHead>
      <GridRow data-value="header" {...headerRowProps}>
        <GridColHeader {sortOrder} {onSort}>Name</GridColHeader>
      </GridRow>
    </GridHead>
  {/if}
  <GridBody {label} {collapsible}>
    {#each values as value (value)}
      <GridRow data-value={value}>
        <GridCell>
          {#if withButtons}
            <button type="button">{labels[value]}</button>
          {:else}
            {labels[value]}
          {/if}
        </GridCell>
      </GridRow>
    {/each}
  </GridBody>
  {#if withFoot}
    <GridFoot>
      <GridRow data-value="footer">
        <GridCell>Total</GridCell>
      </GridRow>
    </GridFoot>
  {/if}
</Grid>
