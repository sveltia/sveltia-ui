<!--
  @component
  A draggable handle for resizing adjacent panes within a `<ResizablePaneGroup>`.
  @see https://w3c.github.io/aria/#separator
  @see https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
-->
<script>
  import { isRTL } from '@sveltia/i18n';
  import { getContext, onDestroy } from 'svelte';
  import { getAccessibleName } from '../../services/label.js';
  import { startPointerDrag } from '../../services/pointer-drag.js';
  import { getHandleKeyAction, getHandleRange, pixelDeltaToPercent } from './sizing.js';

  /**
   * @import { Snippet } from 'svelte';
   * @import { PaneGroupContext } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {boolean} [disabled] Whether to disable the handle.
   * @property {boolean} [showHandleBar] Whether to show the handle bar.
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {string} [ariaLabel] The `aria-label` attribute on the wrapper element.
   * @property {Snippet} [children] Custom handle content. If omitted, a default visual indicator is
   * rendered.
   * @property {() => void} [onResizeStart] Called when a resize interaction begins (pointer down or
   * first keyboard step).
   * @property {() => void} [onResizeEnd] Called when a resize interaction ends (pointer up/cancel
   * or handle blur).
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    disabled = false,
    showHandleBar = false,
    class: className,
    ariaLabel = undefined,
    children,
    onResizeStart,
    onResizeEnd,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /** @type {PaneGroupContext} */
  const ctx = getContext('paneGroup');

  if (!ctx) {
    throw new Error('<ResizableHandle> must be used inside a <ResizablePaneGroup>');
  }

  /**
   * A reference to the handle element.
   * @type {HTMLElement | undefined}
   */
  let element = $state();

  const handle = ctx.registerHandle(() => element);
  // The handles are counted in the order they are in the group, which changes as panes are shown
  // and hidden
  const handleIndex = $derived(handle.index);

  onDestroy(() => {
    handle.unregister();
  });
  const isHorizontal = $derived(ctx.direction === 'horizontal');
  const sizes = $derived(ctx.sizes);
  // The value reported via aria-valuenow is the size of the pane immediately before this handle
  const currentPaneSize = $derived(sizes[handleIndex] ?? 0);
  // The handle only moves space between the panes either side of it, so its range is bound by
  // what those two panes can take
  const range = $derived(
    getHandleRange({
      sizeBefore: currentPaneSize,
      sizeAfter: sizes[handleIndex + 1] ?? 0,
      constraintsBefore: ctx.getPaneConstraints(handleIndex),
      constraintsAfter: ctx.getPaneConstraints(handleIndex + 1),
    }),
  );

  let dragging = $state(false);
  /**
   * Pointer position along the group’s direction when the drag began.
   */
  let startScreenPos = 0;
  /**
   * Size of the pane before the handle when the drag began. Each move sets the pane to this plus
   * the distance from where the drag began, rather than adding the latest step to the current
   * size, so the handle stays under the pointer after it has been held back at a limit.
   */
  let startPaneSize = 0;
  /**
   * Function to stop following the pointer in the middle of a drag.
   * @type {(() => void) | undefined}
   */
  let stopDrag;
  /**
   * Whether the handle is being resized via keyboard (at least one step fired).
   */
  let keyResizing = $state(false);

  /**
   * The space the panes share in pixels, used for px→% conversion. Measured once when a drag
   * begins rather than on every pointer move: measuring forces the browser to lay the page out,
   * which is the last thing wanted in the middle of a drag, and the group cannot change size while
   * the pointer holding it is down.
   * @type {number}
   */
  let containerSize = 0;

  /**
   * Handle pointer move events while dragging.
   * @param {PointerEvent} event `pointermove` event.
   */
  const onPointerMove = (event) => {
    if (disabled) return;

    event.preventDefault();
    event.stopPropagation();

    const { screenX, screenY } = event;
    const screenPos = isHorizontal ? screenX : screenY;

    // A group that has no size, because it isn’t laid out, can’t be resized
    /* v8 ignore next */
    if (!containerSize) return;

    const percentDelta = pixelDeltaToPercent({
      delta: screenPos - startScreenPos,
      containerSize,
      isHorizontal,
      rtl: isRTL(),
    });

    ctx.resize(handleIndex, startPaneSize + percentDelta - (sizes[handleIndex] ?? 0));
  };

  /**
   * Handle the end of a drag.
   */
  const onDragEnd = () => {
    dragging = false;
    stopDrag = undefined;

    onResizeEnd?.();
  };

  /**
   * Handle pointer down events on the handle.
   * @param {PointerEvent} event `pointerdown` event.
   */
  const onPointerDown = (event) => {
    // Only the primary button resizes; the others are left to open a context menu and the like
    if (disabled || event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    const { screenX, screenY } = event;

    // A pointer pressed while another one is dragging takes over
    stopDrag?.();
    dragging = true;
    startScreenPos = isHorizontal ? screenX : screenY;
    startPaneSize = sizes[handleIndex] ?? 0;
    containerSize = ctx.measurePaneSpace();
    stopDrag = startPointerDrag(/** @type {HTMLElement} */ (element), event, {
      onMove: onPointerMove,
      onEnd: onDragEnd,
    });

    onResizeStart?.();
  };

  /**
   * Handle keyboard events for accessibility. Arrow keys move the handle by 1%; Shift+Arrow moves
   * by 10%. Enter collapses/restores the primary pane. Home/End jump to min/max.
   * @param {KeyboardEvent} event `keydown` event.
   */
  const onKeyDown = (event) => {
    if (disabled) return;

    const { key, shiftKey } = event;
    const action = getHandleKeyAction({ key, shiftKey, isHorizontal, rtl: isRTL() });

    if (!action) return;

    event.preventDefault();
    event.stopPropagation();

    if (action.type === 'toggle') {
      ctx.toggleCollapse(handleIndex);

      return;
    }

    // Home and End send an oversized delta, which gets clamped to the min/max internally
    if (key !== 'Home' && key !== 'End' && !keyResizing) {
      keyResizing = true;
      onResizeStart?.();
    }

    ctx.resize(handleIndex, action.delta);
  };

  /**
   * Handle blur to signal keyboard resize end.
   */
  const onBlur = () => {
    if (keyResizing) {
      keyResizing = false;
      onResizeEnd?.();
    }
  };

  $effect(() => () => {
    // Stop listening if the handle is removed in the middle of a drag
    stopDrag?.();
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={element}
  {...restProps}
  role="separator"
  tabindex={disabled ? -1 : 0}
  aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
  aria-valuenow={Math.round(currentPaneSize)}
  aria-valuemin={range.min}
  aria-valuemax={range.max}
  aria-controls={ctx.paneDefs[handleIndex]?.id}
  aria-disabled={disabled || undefined}
  aria-label={getAccessibleName({ ariaLabel, props: restProps })}
  class="sui resizable-handle {className}"
  class:horizontal={isHorizontal}
  class:vertical={!isHorizontal}
  class:disabled
  class:dragging
  onpointerdown={onPointerDown}
  onkeydown={onKeyDown}
  onblur={onBlur}
>
  {#if children}
    {@render children()}
  {:else if showHandleBar}
    <div role="none" class="handle-bar"></div>
  {/if}
</div>

<style lang="scss">
  .resizable-handle {
    position: relative;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    outline-offset: 0;
    background-color: transparent;
    transition: background-color 200ms;

    &:focus-visible,
    &:hover,
    &.dragging {
      outline: none;
      z-index: 1;
      background-color: var(--sui-primary-accent-color-translucent-light);

      .handle-bar {
        background-color: var(--sui-primary-accent-color);
      }
    }

    &.disabled {
      pointer-events: none;
      opacity: 0.4;
    }

    // The handle draws at 4px, but gets a 24px pointer target across the panes it separates
    // (WCAG 2.5.8). Pointer events on the pseudo-element are delivered to the handle itself.
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 1;
    }

    &.horizontal {
      width: var(--sui-resizable-handle-size, 4px);
      height: 100%;
      cursor: col-resize;

      &::before {
        inset-inline: calc((var(--sui-resizable-handle-size, 4px) - 24px) / 2);
      }

      .handle-bar {
        width: 2px;
        height: 40%;
        min-height: 20px;
      }
    }

    &.vertical {
      width: 100%;
      height: var(--sui-resizable-handle-size, 4px);
      cursor: row-resize;

      &::before {
        inset-block: calc((var(--sui-resizable-handle-size, 4px) - 24px) / 2);
      }

      .handle-bar {
        height: 2px;
        width: 40%;
        min-width: 20px;
      }
    }

    .handle-bar {
      border-radius: 1px;
      background-color: hsl(var(--sui-border-color-1-hsl));
      transition: background-color 200ms;
    }
  }
</style>
