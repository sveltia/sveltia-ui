<!--
  @component
  The equivalent of the HTML `<tbody>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody
  @see https://w3c.github.io/aria/#rowgroup
-->
<script>
  import { generateElementId } from '@sveltia/utils/element';

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

  const id = generateElementId('tbody');
</script>

<div
  role="rowgroup"
  class="sui table-body row-group {className}"
  aria-labelledby={label ? `${id}-label` : undefined}
  aria-roledescription="table body"
  {...$$restProps}
>
  {#if label}
    <div role="row" class="row-group-caption">
      <!-- We need `colspan` here but cannot place `<th>` under `<div>`, so use a hack -->
      <!-- prettier-ignore -->
      <svelte:element this={'th'} role="rowheader" id="{id}-label" colspan="9999">
        {label}
      </svelte:element>
    </div>
  {/if}
  <slot />
</div>

<style lang="scss">
  [role='rowgroup'] {
    display: table-row-group;
  }

  [role='row'] {
    display: table-row;
  }

  [role='rowheader'] {
    display: table-cell;
    padding: 8px;
    color: var(--sui-secondary-foreground-color);
    background-color: var(--sui-secondary-background-color);
    font-size: var(--sui-font-size-default);
    text-align: left;
  }
</style>
