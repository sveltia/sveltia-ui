<!--
  @component
  Container for resizable panes. Panes must be separated by `<ResizableHandle>` components.
  @see https://w3c.github.io/aria/#separator
  @see https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
-->
<script>
  import { setContext } from 'svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { PaneGroupContext } from '$lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {'horizontal' | 'vertical'} [direction] Layout direction of the panes.
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {Snippet} [children] Primary slot content.
   * @property {(detail: { sizes: number[] }) => void} [onResize] `resize` event handler, called
   * whenever the pane sizes change.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    direction = 'horizontal',
    class: className,
    children,
    onResize,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  /**
   * `ResizablePane` definitions in registration order, populated synchronously by child
   * `<ResizablePane>` components.
   * @type {{ id: string, defaultSize: number | undefined, minSize: number, maxSize: number }[]}
   */
  const _paneDefs = $state([]);

  /**
   * Current pane sizes as percentages.
   * @type {number[]}
   */
  const sizes = $state([]);

  /**
   * Per-handle saved sizes before collapse, for Enter key restore.
   * @type {(number | undefined)[]}
   */
  const _savedSizes = $state([]);

  let _handleCount = 0;

  /**
   * Initialize pane sizes from `defaultSize` props. Called from `onMount` once all panes have
   * registered. Panes without `defaultSize` share the remaining space equally.
   */
  const initSizes = () => {
    if (!_paneDefs.length) return;

    const totalSpecified = _paneDefs.reduce((sum, p) => sum + (p.defaultSize ?? 0), 0);
    const unspecifiedCount = _paneDefs.filter((p) => p.defaultSize === undefined).length;
    const remaining = Math.max(0, 100 - totalSpecified);
    const defaultSize = unspecifiedCount > 0 ? remaining / unspecifiedCount : 0;
    const newSizes = _paneDefs.map((p) => p.defaultSize ?? defaultSize);

    sizes.splice(0, sizes.length, ...newSizes);
  };

  /**
   * Resize panes around a handle by the given delta (percentage points).
   * @param {number} handleIndex Index of the resize handle.
   * @param {number} deltaPercent Size delta in percentage points.
   */
  const resize = (handleIndex, deltaPercent) => {
    const beforeIdx = handleIndex;
    const afterIdx = handleIndex + 1;

    if (beforeIdx < 0 || afterIdx >= sizes.length) return;

    const { minSize: minBefore = 0, maxSize: maxBefore = 100 } = _paneDefs[beforeIdx];
    const { minSize: minAfter = 0, maxSize: maxAfter = 100 } = _paneDefs[afterIdx];
    const prevBefore = sizes[beforeIdx];
    const prevAfter = sizes[afterIdx];
    // Clamp delta so neither pane exceeds its min/max constraints
    const canGrow = Math.min(maxBefore - prevBefore, prevAfter - minAfter);
    const canShrink = Math.min(prevBefore - minBefore, maxAfter - prevAfter);

    const delta =
      deltaPercent > 0 ? Math.min(deltaPercent, canGrow) : -Math.min(-deltaPercent, canShrink);

    sizes[beforeIdx] = prevBefore + delta;
    sizes[afterIdx] = prevAfter - delta;

    onResize?.({ sizes: sizes.map((s) => Number(s.toFixed(1))) });
  };

  /**
   * Toggle collapse of the primary pane (before the given handle). If the pane is above its minimum
   * size it is collapsed to `minSize`; if already at `minSize` the previous size is restored.
   * @param {number} handleIndex Index of the resize handle.
   */
  const toggleCollapse = (handleIndex) => {
    const { minSize: minBefore = 0 } = _paneDefs[handleIndex];

    if (_savedSizes[handleIndex] !== undefined) {
      const delta = /** @type {number} */ (_savedSizes[handleIndex]) - sizes[handleIndex];

      _savedSizes[handleIndex] = undefined;
      resize(handleIndex, delta);
    } else {
      _savedSizes[handleIndex] = sizes[handleIndex];
      resize(handleIndex, -(sizes[handleIndex] - minBefore));
    }
  };

  setContext(
    'paneGroup',
    /* eslint-disable jsdoc/require-jsdoc */
    /** @type {PaneGroupContext} */ ({
      get direction() {
        return direction;
      },
      sizes,
      registerPane: ({ id, defaultSize, minSize, maxSize }) => {
        const idx = _paneDefs.length;

        _paneDefs.push({ id, defaultSize, minSize, maxSize });

        return { index: idx };
      },
      registerHandle: () => {
        const idx = _handleCount;

        _handleCount += 1;

        return idx;
      },
      resize,
      toggleCollapse,
      paneDefs: _paneDefs,
    }),
    /* eslint-enable jsdoc/require-jsdoc */
  );

  $effect(() => {
    if (_paneDefs.length && !sizes.length) {
      initSizes();
    }
  });
</script>

<div
  {...restProps}
  role="none"
  class="sui resizable-pane-group {direction} {className ?? ''}"
  data-direction={direction}
>
  {@render children?.()}
</div>

<style lang="scss">
  .resizable-pane-group {
    display: flex;
    overflow: hidden;

    &.horizontal {
      flex-direction: row;
      width: 100%;
      height: 100%;
    }

    &.vertical {
      flex-direction: column;
      width: 100%;
      height: 100%;
    }
  }
</style>
