<!--
  @component
  The interactive version of `<TableBody>`.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody
  @see https://w3c.github.io/aria/#rowgroup
-->
<script>
  import { getRandomId } from '$lib/services/util';

  /**
   * The `class` attribute on the wrapper element.
   * @type {string}
   */
  let className = '';
  export { className as class };

  /**
   * Display label for the row group.
   * @type {string}
   */
  export let label = '';

  const id = getRandomId('tbody');
</script>

<div
  role="rowgroup"
  class="sui grid-body rowgroup {className}"
  aria-labelledby={label ? `${id}-label` : undefined}
  aria-roledescription="grid body"
  {...$$restProps}
>
  {#if label}
    <tr>
      <th id="{id}-label" colspan="9999" scope="rowgroup">{label}</th>
    </tr>
  {/if}
  <slot />
</div>

<style lang="scss">
  .grid-body {
    display: table-row-group;
  }

  th {
    padding: 8px;
    color: var(--sui-secondary-foreground-color);
    background-color: var(--sui-secondary-background-color);
    font-size: var(--sui-font-size-default);
    text-align: left;
  }
</style>
