<!--
  @component
  Test fixture: a `<ResizablePaneGroup>` with two or three panes and handles between them.
-->
<script>
  import ResizableHandle from './resizable-handle.svelte';
  import ResizablePaneGroup from './resizable-pane-group.svelte';
  import ResizablePane from './resizable-pane.svelte';

  /**
   * @type {{
   * direction?: 'horizontal' | 'vertical',
   * firstDefaultSize?: number | string,
   * firstMinSize?: number | string,
   * firstMaxSize?: number | string,
   * secondDefaultSize?: number | string,
   * third?: boolean,
   * trailingHandle?: boolean,
   * disabled?: boolean,
   * showHandleBar?: boolean,
   * onResize?: (detail: { sizes: number[] }) => void,
   * onPaneResize?: (detail: { size: number }) => void,
   * onResizeStart?: () => void,
   * onResizeEnd?: () => void,
   * }}
   */
  const {
    direction = 'horizontal',
    firstDefaultSize = undefined,
    firstMinSize = 0,
    firstMaxSize = 100,
    secondDefaultSize = undefined,
    third = false,
    trailingHandle = false,
    disabled = false,
    showHandleBar = false,
    onResize = undefined,
    onPaneResize = undefined,
    onResizeStart = undefined,
    onResizeEnd = undefined,
  } = $props();

  /**
   * The wrapper leaves the panes 500×300 px to share once the 4 px handles have taken their room,
   * so the pixel sizes in the tests are round.
   */
  const handleCount = $derived(1 + Number(third) + Number(trailingHandle));
</script>

<div class="wrapper" style="width: {500 + handleCount * 4}px; height: {300 + handleCount * 4}px;">
  <ResizablePaneGroup {direction} {onResize}>
    <ResizablePane
      class="first"
      defaultSize={firstDefaultSize}
      minSize={firstMinSize}
      maxSize={firstMaxSize}
      onResize={onPaneResize}
    >
      First
    </ResizablePane>
    <ResizableHandle ariaLabel="Resize" {disabled} {showHandleBar} {onResizeStart} {onResizeEnd} />
    <ResizablePane class="second" defaultSize={secondDefaultSize}>Second</ResizablePane>
    {#if third}
      <ResizableHandle ariaLabel="Resize second">
        <span class="custom-handle">||</span>
      </ResizableHandle>
      <ResizablePane class="third">Third</ResizablePane>
    {/if}
    {#if trailingHandle}
      <ResizableHandle ariaLabel="Trailing" />
    {/if}
  </ResizablePaneGroup>
</div>
