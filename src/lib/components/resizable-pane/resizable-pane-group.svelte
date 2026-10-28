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
   * @import { PaneGroupContext, ResizablePaneSize } from '#lib/typedefs.js';
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
   * defaultSize: ResizablePaneSize | undefined,
   * minSize: ResizablePaneSize,
   * maxSize: ResizablePaneSize,
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
   * `ResizablePane` definitions in the order of the panes in the group. Child `<ResizablePane>`
   * components register in the order they’re mounted, which is only the order in the group the
   * first time; one shown later with `{#if}` comes last until {@link syncOrder} puts it in place.
   * @type {PaneDef[]}
   */
  let _paneDefs = $state.raw([]);

  /**
   * Functions to get the `<ResizableHandle>` elements, in the order of the handles in the group.
   * @type {(() => HTMLElement | undefined)[]}
   */
  let _handles = $state.raw([]);

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
   * The sizes last reported with `onResize`, to report a change only once.
   */
  let reportedSizes = '';

  /**
   * Initialize pane sizes from `defaultSize` props. Called once all panes have registered. Panes
   * without `defaultSize` share the remaining space equally, and every size is kept within its
   * pane’s `minSize` and `maxSize`.
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

    const constraints = _paneDefs.map((p) => resolvePaneConstraints(p, env));

    sizes.splice(0, sizes.length, ...getInitialSizes(resolvedDefaults, constraints));
    // The initial sizes aren’t reported, only the changes from them
    reportedSizes = sizes.map((size) => Number(size.toFixed(1))).join();
  };

  /**
   * Call `onResize` with the current sizes, if they’ve changed since the last call.
   */
  const reportSizes = () => {
    const rounded = sizes.map((size) => Number(size.toFixed(1)));
    const key = rounded.join();

    if (key !== reportedSizes) {
      reportedSizes = key;
      onResize?.({ sizes: rounded });
    }
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

    reportSizes();
  };

  /**
   * Toggle collapse of the primary pane (before the given handle). If the pane is above its minimum
   * size it is collapsed to `minSize`; if already at `minSize` the previous size is restored.
   * @param {number} handleIndex Index of the resize handle.
   */
  const toggleCollapse = (handleIndex) => {
    const { minSize: minBefore } = getPaneConstraints(handleIndex);

    // The saved size is only restored while the pane is still collapsed; once it has been resized
    // since, it’s collapsed again from where it is
    if (_savedSizes[handleIndex] !== undefined && Math.abs(sizes[handleIndex] - minBefore) < 0.1) {
      const delta = /** @type {number} */ (_savedSizes[handleIndex]) - sizes[handleIndex];

      _savedSizes[handleIndex] = undefined;
      resize(handleIndex, delta);
    } else {
      _savedSizes[handleIndex] = sizes[handleIndex];
      resize(handleIndex, -(sizes[handleIndex] - minBefore));
    }
  };

  /**
   * Give the given space to the given panes, the first one first, then to the others, as far as
   * their maximum sizes allow, or take it from them with a negative amount, as far as their minimum
   * sizes allow.
   * @param {number[]} neighbors Indexes of the panes to give the space to first.
   * @param {number} amount Space in percentage points.
   * @param {number} [exclude] Index of a pane to leave alone.
   * @returns {number} Space that couldn’t be given or taken.
   */
  const shareSpace = (neighbors, amount, exclude) => {
    let rest = amount;

    [...neighbors, ...sizes.map((_size, index) => index)].forEach((neighbor) => {
      if (Math.abs(rest) < 0.001 || neighbor === exclude || sizes[neighbor] === undefined) {
        return;
      }

      const { minSize, maxSize } = getPaneConstraints(neighbor);
      const size = Math.min(Math.max(sizes[neighbor] + rest, minSize), maxSize);

      rest -= size - sizes[neighbor];
      sizes[neighbor] = size;
    });

    return rest;
  };

  /**
   * Put the panes and handles in the order they are in the group, and size a pane shown after the
   * initial layout, taking its space from the panes next to it.
   */
  const syncOrder = () => {
    // Only called once the group is mounted
    /* v8 ignore next */
    if (!element || !sizes.length) return;

    const paneIds = [...element.querySelectorAll(':scope > .resizable-pane')].map(({ id }) => id);

    /**
     * Get the position of the given pane in the group, or the end if it isn’t in it yet.
     * @param {PaneDef} def Pane definition.
     * @returns {number} Position.
     */
    const getPosition = (def) => {
      const position = paneIds.indexOf(def.id);

      return position === -1 ? Infinity : position;
    };

    const defs = _paneDefs.toSorted((a, b) => getPosition(a) - getPosition(b));
    const newSizes = defs.map((def) => sizes[_paneDefs.indexOf(def)]);
    const isReordered = defs.some((def, index) => def !== _paneDefs[index]);

    if (isReordered) {
      _paneDefs = defs;
      sizes.splice(0, sizes.length, ...newSizes);
      _savedSizes.length = 0;
    }

    sizes.forEach((size, index) => {
      if (!Number.isNaN(size)) {
        return;
      }

      const env = getSizeEnvironment();
      const def = _paneDefs[index];
      const { minSize, maxSize } = resolvePaneConstraints(def, env);

      const defaultSize =
        def.defaultSize === undefined ? NaN : resolveToPercent(def.defaultSize, NaN, env);

      const wanted = Math.min(
        Math.max(Number.isNaN(defaultSize) ? 100 / sizes.length : defaultSize, minSize),
        maxSize,
      );

      sizes[index] = 0;
      sizes[index] = wanted + shareSpace([index - 1, index + 1], -wanted, index);
    });

    const handleElements = [...element.querySelectorAll(':scope > .resizable-handle')];

    /**
     * Get the position of the given handle in the group, or the end if it isn’t in it yet.
     * @param {() => HTMLElement | undefined} getElement Function to get the handle element.
     * @returns {number} Position.
     */
    const getHandlePosition = (getElement) => {
      const position = handleElements.indexOf(/** @type {HTMLElement} */ (getElement()));

      return position === -1 ? Infinity : position;
    };

    const handles = _handles.toSorted((a, b) => getHandlePosition(a) - getHandlePosition(b));

    if (handles.some((handle, index) => handle !== _handles[index])) {
      _handles = handles;
      _savedSizes.length = 0;
    }

    // Reported here rather than as a pane leaves, which also happens when the whole group is
    // removed: this observer callback doesn’t run then, as the observer is disconnected first
    if (!sizes.some((size) => Number.isNaN(size))) {
      reportSizes();
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
      registerPane: (def) => {
        _paneDefs = [..._paneDefs, def];

        // A pane shown after the initial layout is sized once it’s in place; see `syncOrder()`
        if (sizes.length) {
          sizes.push(NaN);
        }

        return {
          get index() {
            return _paneDefs.indexOf(def);
          },
          unregister: () => {
            const index = _paneDefs.indexOf(def);

            if (index === -1) {
              return;
            }

            _paneDefs = _paneDefs.toSpliced(index, 1);

            // Its space goes to the panes next to it
            if (sizes.length) {
              const [size] = sizes.splice(index, 1);

              _savedSizes.length = 0;

              if (sizes.length && !Number.isNaN(size)) {
                shareSpace([index - 1, index], size);
              }
            }
          },
        };
      },
      registerHandle: (getElement) => {
        _handles = [..._handles, getElement];

        return {
          get index() {
            return _handles.indexOf(getElement);
          },
          unregister: () => {
            _handles = _handles.filter((handle) => handle !== getElement);
            _savedSizes.length = 0;
          },
        };
      },
      resize,
      toggleCollapse,
      getPaneConstraints,
      measurePaneSpace,
      get paneDefs() {
        return _paneDefs;
      },
    }),
    /* eslint-enable jsdoc/require-jsdoc */
  );

  $effect(() => {
    if (_paneDefs.length && !sizes.length) {
      initSizes();
    }
  });

  // Panes and handles can be shown and hidden after the initial layout, with `{#if}` for example
  $effect(() => {
    if (!element) {
      return undefined;
    }

    const observer = new MutationObserver(() => syncOrder());

    observer.observe(element, { childList: true });

    return () => {
      observer.disconnect();
    };
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
