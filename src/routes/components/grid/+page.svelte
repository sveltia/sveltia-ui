<script>
  import { Grid, GridBody, GridCell, GridColHeader, GridHead, GridRow, GridRowHeader } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Grid</h2>

<section>
  <h3>Standard</h3>
  <Example>
    <div>
      <Grid class="data">
        <GridHead>
          <GridRow>
            <GridColHeader />
            <GridColHeader>Column 1</GridColHeader>
            <GridColHeader>Column 2</GridColHeader>
            <GridColHeader>Column 3</GridColHeader>
          </GridRow>
        </GridHead>
        <GridBody>
          <GridRow>
            <GridRowHeader>Row 1</GridRowHeader>
            <GridCell>Cell 1</GridCell>
            <GridCell>Cell 2</GridCell>
            <GridCell>Cell 3</GridCell>
          </GridRow>
          <GridRow>
            <GridRowHeader>Row 2</GridRowHeader>
            <GridCell>Cell 4</GridCell>
            <GridCell>Cell 5</GridCell>
            <GridCell>Cell 6</GridCell>
          </GridRow>
          <GridRow>
            <GridColHeader />
            <GridColHeader>Column 1</GridColHeader>
            <GridColHeader>Column 2</GridColHeader>
            <GridColHeader>Column 3</GridColHeader>
          </GridRow>
        </GridBody>
      </Grid>
    </div>
  </Example>
</section>
