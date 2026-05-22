<!--
  @component
  A resizable pane within a `<ResizablePaneGroup>`. Must be a direct child of
  `<ResizablePaneGroup>`.
-->
<script>
  import { getContext, untrack } from 'svelte';

  /**
   * @import { Snippet } from 'svelte';
   * @import { PaneGroupContext } from '$lib/typedefs.js';
   */

  /**
   * @typedef {object} Props
   * @property {number | string} [defaultSize] Default size. Numbers are percentages (0-100);
   * strings can be any CSS length/percentage such as `240px`, `20%` or `20dvw`. Panes without
   * `defaultSize` share the remaining space equally.
   * @property {number | string} [minSize] Minimum size. Numbers are percentages, strings are CSS
   * lengths. Defaults to `0`.
   * @property {number | string} [maxSize] Maximum size. Numbers are percentages, strings are CSS
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

  // svelte-ignore state_referenced_locally
  const { index: paneIndex } = ctx.registerPane({ id, defaultSize, minSize, maxSize });

  const direction = $derived(ctx.direction);
  const size = $derived(ctx.sizes[paneIndex]);
  const sizeStyle = $derived.by(() => {
    if (size !== undefined) {
      return `${size}%`;
    }

    if (typeof defaultSize === 'number') {
      return `${defaultSize}%`;
    }

    return defaultSize ?? '0%';
  });

  $effect(() => {
    if (size !== undefined) {
      untrack(() => onResize?.({ size: Number(size.toFixed(1)) }));
    }
  });
</script>

<div
  {...restProps}
  {id}
  role="none"
  class="sui resizable-pane {className ?? ''}"
  style:flex-basis={sizeStyle}
  style:flex-grow="0"
  style:flex-shrink="0"
  style:overflow-x={direction === 'horizontal' ? 'auto' : undefined}
  style:overflow-y={direction === 'vertical' ? 'auto' : undefined}
>
  {@render children?.()}
</div>
