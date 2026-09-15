<!--
  @component
  A draggable handle for resizing adjacent panes within a `<ResizablePaneGroup>`.
  @see https://w3c.github.io/aria/#separator
  @see https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
-->
<script>
  import { isRTL } from '@sveltia/i18n';
  import { getContext } from 'svelte';
  import { getHandleKeyAction } from './sizing.js';

  /**
   * @import { Snippet } from 'svelte';
   * @import { PaneGroupContext } from '$lib/typedefs.js';
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

  const handleIndex = ctx.registerHandle();
  const isHorizontal = $derived(ctx.direction === 'horizontal');
  const sizes = $derived(ctx.sizes);
  // The value reported via aria-valuenow is the size of the pane immediately before this handle
  const currentPaneSize = $derived(sizes[handleIndex] ?? 0);
  const currentPaneConstraints = $derived(ctx.getPaneConstraints(handleIndex));
  const currentPaneMin = $derived(
    Math.max(
      currentPaneConstraints.minSize,
      100 -
        ctx.paneDefs.reduce(
          (sum, _pane, i) => sum + (i !== handleIndex ? ctx.getPaneConstraints(i).maxSize : 0),
          0,
        ),
    ),
  );
  const currentPaneMax = $derived(
    Math.min(
      currentPaneConstraints.maxSize,
      100 -
        ctx.paneDefs.reduce(
          (sum, _pane, i) => sum + (i !== handleIndex ? ctx.getPaneConstraints(i).minSize : 0),
          0,
        ),
    ),
  );

  /**
   * A reference to the handle element.
   * @type {HTMLElement | undefined}
   */
  let element = $state();
  let dragging = $state(false);
  let startScreenPos = $state(0);
  let targetPointerId = $state(0);
  /**
   * Whether the handle is being resized via keyboard (at least one step fired).
   */
  let keyResizing = $state(false);

  /**
   * The pane group container's size in pixels, used for px→% conversion. Measured once when a drag
   * begins rather than on every pointer move: reading `clientWidth` forces the browser to lay the
   * page out, which is the last thing wanted in the middle of a drag, and the container cannot
   * change size while the pointer holding it is down.
   * @type {number}
   */
  let containerSize = 0;

  /**
   * Measure the pane group container element's size in pixels.
   * @returns {number} Container size in pixels.
   */
  const measureContainerSize = () => {
    const container = element?.closest('.resizable-pane-group');

    // The handle can’t be rendered outside a group; see the context check above
    /* v8 ignore next */
    if (!container) return 0;

    return isHorizontal ? container.clientWidth : container.clientHeight;
  };

  /**
   * Handle pointer move events (attached to `document` while dragging).
   * @param {PointerEvent} event `pointermove` event.
   */
  const onPointerMove = (event) => {
    const { screenX, screenY, pointerId } = event;

    if (disabled || !dragging || pointerId !== targetPointerId) return;

    event.preventDefault();
    event.stopPropagation();

    const screenPos = isHorizontal ? screenX : screenY;
    const pixelDelta = screenPos - startScreenPos;

    // A group that has no size, because it isn’t laid out, can’t be resized
    /* v8 ignore next */
    if (!containerSize) return;

    let percentDelta = (pixelDelta / containerSize) * 100;

    // In RTL with a horizontal layout, the visual direction is reversed
    if (isHorizontal && isRTL()) {
      percentDelta = -percentDelta;
    }

    startScreenPos = screenPos;
    ctx.resize(handleIndex, percentDelta);
  };

  /**
   * Handle pointer up/cancel events (attached to `document` while dragging).
   * @param {PointerEvent} event `pointerup` or `pointercancel` event.
   */
  const onPointerUp = (event) => {
    const { pointerId } = event;

    if (!dragging || pointerId !== targetPointerId) return;

    element?.releasePointerCapture(pointerId);
    dragging = false;
    startScreenPos = 0;
    targetPointerId = 0;

    onResizeEnd?.();

    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
  };

  /**
   * Handle pointer down events on the handle.
   * @param {PointerEvent} event `pointerdown` event.
   */
  const onPointerDown = (event) => {
    if (disabled) return;

    event.preventDefault();
    event.stopPropagation();

    const { screenX, screenY, pointerId } = event;

    dragging = true;
    startScreenPos = isHorizontal ? screenX : screenY;
    targetPointerId = pointerId;
    containerSize = measureContainerSize();
    element?.setPointerCapture(pointerId);

    onResizeStart?.();

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
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
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={element}
  {...restProps}
  role="separator"
  tabindex={disabled ? -1 : 0}
  aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
  aria-valuenow={Math.round(currentPaneSize)}
  aria-valuemin={currentPaneMin}
  aria-valuemax={currentPaneMax}
  aria-controls={ctx.paneDefs[handleIndex]?.id}
  aria-disabled={disabled || undefined}
  aria-label={ariaLabel}
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
