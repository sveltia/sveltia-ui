<!--
  @component
  Test fixture: an `<InfiniteScroll>` list within a short scroll container, or within the page.
-->
<script>
  import InfiniteScroll from './infinite-scroll.svelte';

  /**
   * @typedef {object} Props
   * @property {{ id: string, label: string }[]} items Items.
   * @property {number} [itemChunkSize] Number of items to be loaded at once.
   * @property {boolean} [scrollable] Whether the list is within a scroll container.
   * @property {boolean} [wrapped] Whether the list is also within a horizontal scroller.
   * @property {number} [innerHeight] Height of a vertical scroller within the outer one, if any.
   */

  /** @type {Props} */
  const {
    items,
    itemChunkSize = 25,
    scrollable = true,
    wrapped = false,
    innerHeight = undefined,
  } = $props();
</script>

<div class="scroller" style={scrollable ? 'height: 100px; overflow: auto;' : undefined}>
  <div
    class="wrapper"
    style={wrapped
      ? 'overflow-x: auto;'
      : innerHeight
        ? `height: ${innerHeight}px; overflow-y: auto;`
        : undefined}
  >
    <InfiniteScroll {items} itemKey="id" {itemChunkSize}>
      {#snippet renderItem(item, index)}
        <div class="item" style="height: 20px;">{index}: {item.label}</div>
      {/snippet}
    </InfiniteScroll>
  </div>
</div>
