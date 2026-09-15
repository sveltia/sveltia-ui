<!--
  @component
  Test fixture: a `<Grid>` with a few selectable rows.
-->
<script>
  import GridBody from './grid-body.svelte';
  import GridCell from './grid-cell.svelte';
  import GridRow from './grid-row.svelte';
  import Grid from './grid.svelte';

  /**
   * @type {{
   * multiple?: boolean,
   * clickToSelect?: boolean,
   * values?: string[],
   * withButtons?: boolean,
   * onChange?: (event: CustomEvent) => void,
   * }}
   */
  const {
    multiple = false,
    clickToSelect = true,
    values = ['a', 'b', 'c'],
    withButtons = false,
    onChange = undefined,
  } = $props();

  /** @type {Record<string, string>} */
  const labels = { a: 'Alpha', b: 'Beta', c: 'Gamma', d: 'Delta', e: 'Epsilon' };
</script>

<Grid ariaLabel="Files" {multiple} {clickToSelect} {onChange}>
  <GridBody>
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
</Grid>
