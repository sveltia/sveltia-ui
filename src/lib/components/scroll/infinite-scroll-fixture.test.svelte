<!--
  @component
  Test fixture: an `<InfiniteScroll>` list within a short scroll container.
-->
<script>
  import InfiniteScroll from './infinite-scroll.svelte';

  /** @type {{ items: { id: string, label: string }[], itemChunkSize?: number }} */
  const { items, itemChunkSize = 25 } = $props();
</script>

<div class="scroller" style="height: 100px; overflow: auto;">
  <InfiniteScroll {items} itemKey="id" {itemChunkSize}>
    {#snippet renderItem(item, index)}
      <div class="item" style="height: 20px;">{index}: {item.label}</div>
    {/snippet}
  </InfiniteScroll>
</div>
