<script>
  import {
    Table,
    TableBody,
    TableCell,
    TableColHeader,
    TableHead,
    TableRow,
    TableRowHeader,
  } from '$lib';
  import Example from '../../_components/example.svelte';
</script>

<h2>Table</h2>

<section>
  <h3>Standard</h3>
  <Example>
    <div>
      <Table class="data">
        <TableHead>
          <TableRow>
            <TableColHeader />
            <TableColHeader>Column 1</TableColHeader>
            <TableColHeader>Column 2</TableColHeader>
            <TableColHeader>Column 3</TableColHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableRowHeader>Row 1</TableRowHeader>
            <TableCell>Cell 1</TableCell>
            <TableCell>Cell 2</TableCell>
            <TableCell>Cell 3</TableCell>
          </TableRow>
          <TableRow>
            <TableRowHeader>Row 2</TableRowHeader>
            <TableCell>Cell 4</TableCell>
            <TableCell>Cell 5</TableCell>
            <TableCell>Cell 6</TableCell>
          </TableRow>
          <TableRow>
            <TableColHeader />
            <TableColHeader>Column 1</TableColHeader>
            <TableColHeader>Column 2</TableColHeader>
            <TableColHeader>Column 3</TableColHeader>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </Example>
</section>
