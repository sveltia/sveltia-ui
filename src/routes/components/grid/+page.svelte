<script>
  import { Grid, GridBody, GridCell, GridColHeader, GridHead, GridRow, GridRowHeader } from '#lib';
  import Example from '../../_components/example.svelte';

  /**
   * @import { ComponentProps } from 'svelte';
   */

  /**
   * @typedef {'name' | 'size'} SortKey
   */

  /** @type {{ name: string, size: number }[]} */
  const files = [
    { name: 'notes.txt', size: 12 },
    { name: 'photo.jpg', size: 2048 },
    { name: 'archive.zip', size: 512 },
  ];

  /** @type {SortKey} */
  let sortKey = $state('name');
  /** @type {'ascending' | 'descending'} */
  let sortOrder = $state('ascending');

  const sortedFiles = $derived(
    files.toSorted((a, b) => {
      const result = sortKey === 'name' ? a.name.localeCompare(b.name) : a.size - b.size;

      return sortOrder === 'ascending' ? result : -result;
    }),
  );

  /**
   * Get a `<GridColHeader>`’s sort props for the given column.
   * @param {SortKey} key Column key.
   * @returns {Pick<ComponentProps<typeof GridColHeader>, 'sortOrder' | 'onSort'>} Props.
   */
  const getSortProps = (key) => ({
    sortOrder: sortKey === key ? sortOrder : 'none',
    /**
     * Sort the rows by the column in the requested order.
     * @param {CustomEvent<{ sortOrder: 'ascending' | 'descending' }>} event `Sort` event.
     */
    onSort: (event) => {
      sortKey = key;
      ({ sortOrder } = event.detail);
    },
  });
</script>

<svelte:head>
  <title>Grid – Sveltia UI</title>
</svelte:head>

<h2>Grid</h2>

<section>
  <h3>Standard</h3>
  <Example>
    <div role="none">
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

<section>
  <h3>Sortable Columns</h3>
  <Example>
    <div role="none">
      <Grid class="data" multiple ariaLabel="Files">
        <GridHead>
          <GridRow>
            <GridColHeader {...getSortProps('name')}>Name</GridColHeader>
            <GridColHeader {...getSortProps('size')}>Size</GridColHeader>
          </GridRow>
        </GridHead>
        <GridBody>
          {#each sortedFiles as { name, size } (name)}
            <GridRow>
              <GridCell>{name}</GridCell>
              <GridCell>{size} KB</GridCell>
            </GridRow>
          {/each}
        </GridBody>
      </Grid>
    </div>
  </Example>
</section>
