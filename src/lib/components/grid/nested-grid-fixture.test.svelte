<!--
  @component
  Test fixture: a `<Grid>` nested in a footer cell of another `<Grid>`.
-->
<script>
  import GridBody from './grid-body.svelte';
  import GridCell from './grid-cell.svelte';
  import GridFoot from './grid-foot.svelte';
  import GridRow from './grid-row.svelte';
  import Grid from './grid.svelte';
</script>

<Grid ariaLabel="Outer">
  <GridBody>
    <GridRow><GridCell>Outer</GridCell></GridRow>
  </GridBody>
  <GridFoot>
    <GridRow>
      <GridCell>
        <Grid ariaLabel="Nested">
          <GridBody>
            <GridRow><GridCell>Inner</GridCell></GridRow>
          </GridBody>
        </Grid>
      </GridCell>
    </GridRow>
  </GridFoot>
</Grid>
