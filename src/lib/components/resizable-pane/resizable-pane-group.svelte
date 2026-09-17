<!--
  @component
  Container for resizable panes. Panes must be separated by `<ResizableHandle>` components.
  @see https://w3c.github.io/aria/#separator
  @see https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
-->
<script>
  import { setContext } from 'svelte';
  import {
    clampResizeDelta,
    getInitialSizes,
    resolvePaneConstraints,
    resolveToPercent,
  } from './sizing.js';

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
   * Measure the space the panes share: the group’s size along its direction, less the handles
   * between them. Every pane size is a percentage of this, so the panes and handles together fill
   * the group exactly. Were the percentages of the whole group, the handles would push the last
   * pane past the edge; the overflow is hidden, but the group could still be scrolled by that much
   * whenever something inside is scrolled into view, and everything would shift out of place.
   * @returns {number} Space in pixels, or `0` if the group isn’t laid out.
   */
  const measurePaneSpace = () => {
    if (!element) {
      return 0;
    }

    const isHorizontal = direction === 'horizontal';
    const groupSize = isHorizontal ? element.clientWidth : element.clientHeight;

    const handleSize = [...element.querySelectorAll(':scope > .resizable-handle')].reduce(
      (total, handle) =>
        total +
        (isHorizontal
          ? /** @type {HTMLElement} */ (handle).offsetWidth
          : /** @type {HTMLElement} */ (handle).offsetHeight),
      0,
    );

    return Math.max(groupSize - handleSize, 0);
  };

  /**
   * Get the sizes the pane lengths are relative to.
   * @returns {import('./sizing.js').SizeEnvironment} Environment.
   */
  const getSizeEnvironment = () => ({
    containerSize: measurePaneSpace(),
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  });

  /**
   * Get pane constraints converted to percentages for the current container size.
   * @param {number} paneIndex Pane index.
   * @returns {{ minSize: number, maxSize: number }} Min/max in percentages.
   */
  const getPaneConstraints = (paneIndex) =>
    resolvePaneConstraints(_paneDefs[paneIndex], getSizeEnvironment());

  /**
   * Initialize pane sizes from `defaultSize` props. Called once all panes have registered. Panes
   * without `defaultSize` share the remaining space equally.
   */
  const initSizes = () => {
    // Only called once panes have registered; see the effect below
    /* v8 ignore next */
    if (!_paneDefs.length) return;

    const env = getSizeEnvironment();

    // Resolve each pane’s defaultSize to a percentage (NaN if unspecified or unresolvable)
    const resolvedDefaults = _paneDefs.map((p) =>
      p.defaultSize === undefined ? NaN : resolveToPercent(p.defaultSize, NaN, env),
    );

    sizes.splice(0, sizes.length, ...getInitialSizes(resolvedDefaults));
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

    const prevBefore = sizes[beforeIdx];
    const prevAfter = sizes[afterIdx];

    // Clamp delta so neither pane exceeds its min/max constraints
    const delta = clampResizeDelta(deltaPercent, {
      sizeBefore: prevBefore,
      sizeAfter: prevAfter,
      constraintsBefore: getPaneConstraints(beforeIdx),
      constraintsAfter: getPaneConstraints(afterIdx),
    });

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
      measurePaneSpace,
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
  class={['sui', 'resizable-pane-group', direction, className]}
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
