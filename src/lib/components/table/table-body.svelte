<!--
  @component
  The equivalent of the HTML `<tbody>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody
  @see https://w3c.github.io/aria/#rowgroup
-->
<script>
  import { generateElementId } from '@sveltia/utils/element';
  /**
   * @typedef {object} Props
   * @property {string} [class] - The `class` attribute on the wrapper element.
   * @property {string} [label] - Display label for the row group.
   * @property {import('svelte').Snippet} [children] - Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    class: className,
    label = '',
    children,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const id = generateElementId('tbody');
</script>

<div
  {...restProps}
  role="rowgroup"
  class="sui table-body row-group {className}"
  aria-labelledby={label ? `${id}-label` : undefined}
  aria-roledescription="table body"
>
  {#if label}
    <div role="row" class="row-group-caption">
      <!-- We need `colspan` here but cannot place `<th>` under `<div>`, so use a hack -->
      <svelte:element this={'th'} role="rowheader" id="{id}-label" colspan="9999">
        {label}
      </svelte:element>
    </div>
  {/if}
  {@render children?.()}
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
