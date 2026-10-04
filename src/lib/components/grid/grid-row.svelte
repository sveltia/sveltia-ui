<!--
  @component
  The interactive version of `<TableRow>`.
  @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr
  @see https://w3c.github.io/aria/#row
-->
<script>
  import TablePart from '../table/table-part.svelte';

  /**
   * @import { Snippet } from 'svelte';
   */

  /**
   * @typedef {object} Props
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {boolean} [selected] Whether to select the widget. An alias of the `aria-selected`
   * attribute.
   * @property {Snippet} [children] Primary slot content.
   * @property {(event: CustomEvent) => void} [onChange] Custom `Change` event handler.
   * @property {(event: CustomEvent) => void} [onSelect] Custom `Select` event handler.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    selected = false,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();
</script>

<TablePart {...restProps} role="row" kind="grid-row" tabindex="0" aria-selected={selected} />
