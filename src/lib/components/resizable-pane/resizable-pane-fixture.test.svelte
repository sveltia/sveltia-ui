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
</script>

<div class="wrapper" style="width: 500px; height: 300px;">
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
