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
   * onChange?: (event: CustomEvent) => void,
   * }}
   */
  const { multiple = false, clickToSelect = true, onChange = undefined } = $props();
</script>

<Grid ariaLabel="Files" {multiple} {clickToSelect} {onChange}>
  <GridBody>
    <GridRow data-value="a"><GridCell>Alpha</GridCell></GridRow>
    <GridRow data-value="b"><GridCell>Beta</GridCell></GridRow>
    <GridRow data-value="c"><GridCell>Gamma</GridCell></GridRow>
  </GridBody>
</Grid>
