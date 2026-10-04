<!--
  @component
  The equivalent of the HTML `<td>` element.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td
  @see https://w3c.github.io/aria/#cell
-->
<script>
  import TablePart from './table-part.svelte';

  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {Snippet} [children] Primary slot content.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<TablePart {...restProps} role="cell" kind="table-cell" />
