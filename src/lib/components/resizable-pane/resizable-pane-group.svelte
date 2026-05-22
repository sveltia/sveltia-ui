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
   * @typedef {{
   * id: string,
   * defaultSize: number | string | undefined,
   * minSize: number | string,
   * maxSize: number | string,
   * }} PaneDef
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
   * @type {PaneDef[]}
   */
  const _paneDefs = $state([]);

  /** @type {HTMLDivElement | undefined} */
  let element = $state();

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
   * Get the pane group container element’s size in pixels for size conversion.
   * @returns {number} Container size in pixels.
   */
  const getContainerSize = () => {
    if (!element) return 0;

    return direction === 'horizontal' ? element.clientWidth : element.clientHeight;
  };

  /**
   * Resolve numeric or CSS string size values to percentage points.
   * @param {number | string | undefined} value Size as percentage number or CSS size string.
   * @param {number} fallback Fallback percentage when resolution fails.
   * @returns {number} Size in percentage points.
   */
  const resolveToPercent = (value, fallback) => {
    if (typeof value === 'number') {
      return value;
    }

    if (!value || typeof value !== 'string') {
      return fallback;
    }

    const trimmed = value.trim();
    const matchedPercent = trimmed.match(/^(-?\d+(?:\.\d+)?)%$/);

    if (matchedPercent) {
      return Number(matchedPercent[1]);
    }

    const containerSize = getContainerSize();

    if (!containerSize) {
      return fallback;
    }

    const matchedPx = trimmed.match(/^(-?\d+(?:\.\d+)?)px$/i);

    if (matchedPx) {
      return (Number(matchedPx[1]) / containerSize) * 100;
    }

    const matchedViewport = trimmed.match(/^(-?\d+(?:\.\d+)?)(dvw|vw|dvh|vh)$/i);

    if (matchedViewport) {
      const viewportValue = Number(matchedViewport[1]);
      const unit = matchedViewport[2].toLowerCase();
      const viewportSize = unit.endsWith('w') ? window.innerWidth : window.innerHeight;
      const pixels = (viewportValue / 100) * viewportSize;

      return (pixels / containerSize) * 100;
    }

    return fallback;
  };

  /**
   * Get pane constraints converted to percentages for the current container size.
   * @param {number} paneIndex Pane index.
   * @returns {{ minSize: number, maxSize: number }} Min/max in percentages.
   */
  const getPaneConstraints = (paneIndex) => {
    const paneDef = _paneDefs[paneIndex];

    if (!paneDef) {
      return { minSize: 0, maxSize: 100 };
    }

    const minSize = Math.max(0, resolveToPercent(paneDef.minSize, 0));
    const maxSize = Math.min(100, resolveToPercent(paneDef.maxSize, 100));

    return {
      minSize,
      maxSize: Math.max(minSize, maxSize),
    };
  };

  /**
   * Initialize pane sizes from `defaultSize` props. Called from `onMount` once all panes have
   * registered. Panes without `defaultSize` share the remaining space equally.
   */
  const initSizes = () => {
    if (!_paneDefs.length) return;

    // Resolve each pane’s defaultSize to a percentage (NaN if unspecified or unresolvable).
    // Resolving once ensures totalSpecified and newSizes use the same resolved value.
    const resolvedDefaults = _paneDefs.map((p) => {
      if (p.defaultSize === undefined) {
        return NaN;
      }

      const resolved = resolveToPercent(p.defaultSize, NaN);

      return resolved;
    });

    const totalSpecified = resolvedDefaults
      .filter((v) => !Number.isNaN(v))
      .reduce((sum, v) => sum + v, 0);

    const unspecifiedCount = resolvedDefaults.filter((v) => Number.isNaN(v)).length;
    const remaining = Math.max(0, 100 - totalSpecified);
    const defaultSize = unspecifiedCount > 0 ? remaining / unspecifiedCount : 0;
    const newSizes = resolvedDefaults.map((v) => (Number.isNaN(v) ? defaultSize : v));

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

    const { minSize: minBefore, maxSize: maxBefore } = getPaneConstraints(beforeIdx);
    const { minSize: minAfter, maxSize: maxAfter } = getPaneConstraints(afterIdx);
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
    const { minSize: minBefore } = getPaneConstraints(handleIndex);

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
      getPaneConstraints,
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
  bind:this={element}
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
