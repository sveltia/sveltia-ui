<!--
  @component
  A resizable pane within a `<ResizablePaneGroup>`. Must be a direct child of
  `<ResizablePaneGroup>`.
-->
<script>
  import { getContext, onDestroy, untrack } from 'svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { PaneGroupContext, ResizablePaneSize } from '#lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {ResizablePaneSize} [defaultSize] Default size. Numbers are percentages (0-100) of
   * the space the panes share, which is the group less its handles; strings can be any CSS
   * length/percentage such as `240px`, `20%` or `20dvw`. Panes without `defaultSize` share the
   * remaining space equally.
   * @property {ResizablePaneSize} [minSize] Minimum size. Numbers are percentages, strings are CSS
   * lengths. Defaults to `0`.
   * @property {ResizablePaneSize} [maxSize] Maximum size. Numbers are percentages, strings are CSS
   * lengths. Defaults to `100`.
   * @property {string} [class] The `class` attribute on the wrapper element.
   * @property {Snippet} [children] Primary slot content.
   * @property {(detail: { size: number }) => void} [onResize] Called whenever this pane’s size (in
   * percent) changes.
   */

  /**
   * @type {Props & Record<string, any>}
   */
  let {
    /* eslint-disable prefer-const */
    defaultSize = undefined,
    minSize = 0,
    maxSize = 100,
    class: className,
    children,
    onResize,
    ...restProps
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();

  /** @type {PaneGroupContext} */
  const ctx = getContext('paneGroup');

  if (!ctx) {
    throw new Error('<ResizablePane> must be used inside a <ResizablePaneGroup>');
  }

  // The sizes are read when they’re needed, so a change to them is followed
  /* eslint-disable jsdoc/require-jsdoc */
  const pane = ctx.registerPane({
    id,
    get defaultSize() {
      return defaultSize;
    },
    get minSize() {
      return minSize;
    },
    get maxSize() {
      return maxSize;
    },
  });
  /* eslint-enable jsdoc/require-jsdoc */

  const direction = $derived(ctx.direction);
  const size = $derived(ctx.sizes[pane.index]);
  /**
   * The size as a flex basis. The percentages are of the space the panes share rather than of the
   * group, while a flex basis is a percentage of the group, so the panes are made shrinkable: the
   * handles then take their room from the panes in proportion to their sizes, which works out to
   * exactly the intended percentages, and the group is never overflowed.
   */
  const sizeStyle = $derived.by(() => {
    // A pane shown after the initial layout has no size until it’s in place
    if (size !== undefined && !Number.isNaN(size)) {
      return `${size}%`;
    }

    if (typeof defaultSize === 'number') {
      return `${defaultSize}%`;
    }

    return defaultSize ?? '0%';
  });

  // Leave the group when removed, giving the space to the panes next to it
  onDestroy(() => {
    pane.unregister();
  });

  $effect(() => {
    if (size !== undefined && !Number.isNaN(size)) {
      untrack(() => onResize?.({ size: Number(size.toFixed(1)) }));
    }
  });
</script>

<div
  {...restProps}
  {id}
  role="none"
  class="sui resizable-pane {className}"
  style:flex-basis={sizeStyle}
  style:flex-grow="0"
  style:flex-shrink="1"
  style:overflow-x={direction === 'horizontal' ? 'auto' : undefined}
  style:overflow-y={direction === 'vertical' ? 'auto' : undefined}
>
  {@render children?.()}
</div>
