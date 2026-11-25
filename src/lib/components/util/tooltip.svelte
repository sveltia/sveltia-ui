<!--
  @component
  A tooltip for a button or another focusable element: a short text shown next to it while the
  pointer rests on it or the keyboard focus is on it, hidden again with the Escape key. It lives in
  the top layer through the Popover API, so a dialog or a scrolling container can’t clip it.

  It’s lazy, as a long list can have a button with a tooltip on every row, most of which are never
  hovered: until the user first points at or focuses the anchor, or the tooltip is forced open,
  there is no popover, and nothing listens to the anchor but a pair of listeners shared by every
  tooltip in the document. Only the description of the anchor is there from the start, as a screen
  reader can read it without moving the focus to the anchor.
  @see https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
  @see https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html
-->
<script>
  import { untrack } from 'svelte';
  import { getAccessibleText, toggleIdInList } from '../../services/tooltip.js';
  import { waitForTooltipActivation } from '../../services/tooltip-activation.js';
  import TooltipPopover from './tooltip-popover.svelte';

  /**
   * @import { TooltipPosition } from '../../services/tooltip.js';
   * @import { TooltipTrigger } from '../../services/tooltip-activation.js';
   */

  /**
   * @typedef {object} Props
   * @property {HTMLElement | undefined} anchor Element the tooltip belongs to.
   * @property {string} text Text to show.
   * @property {TooltipPosition} [position] Side of the anchor to show the tooltip on. Default:
   * `auto`, which is below it. The tooltip moves to the opposite side when there’s no room, and
   * `left` and `right` are swapped in a right-to-left context, like the popup positions.
   * @property {boolean} [open] Whether to show the tooltip regardless of the pointer and focus, for
   * instance to confirm an action for a moment.
   */

  /** @type {Props} */
  let {
    /* eslint-disable prefer-const */
    anchor,
    text,
    position = 'auto',
    open = false,
    /* eslint-enable prefer-const */
  } = $props();

  const id = $props.id();

  /**
   * Interaction that woke the tooltip up, after which the popover stays rendered.
   * @type {TooltipTrigger | undefined}
   */
  let trigger = $state();
  /** Whether the tooltip describes the anchor. */
  let describing = $state(false);

  /**
   * Add the tooltip to the IDs in the anchor’s `aria-describedby`, or take it out, keeping any
   * other IDs set on the anchor.
   * @param {HTMLElement} target Anchor.
   * @param {boolean} include Whether the tooltip should describe the anchor.
   */
  const setDescribedBy = (target, include) => {
    const list = toggleIdInList(target.getAttribute('aria-describedby'), id, include);

    if (list) {
      target.setAttribute('aria-describedby', list);
    } else {
      target.removeAttribute('aria-describedby');
    }
  };

  /**
   * Render the popover on the first interaction with the anchor. A focused anchor removed by a
   * block can wake another tooltip up while the block is still running, where Svelte forbids a
   * state change unless it’s untracked.
   * @param {TooltipTrigger} type What woke the tooltip up.
   */
  const activate = (type) => {
    untrack(() => {
      trigger = type;
    });
  };

  // Describe the anchor with the tooltip, unless the tooltip only repeats its name, which would be
  // read out twice, as it is for an icon button whose tooltip shows its label. The name comes from
  // `aria-label` when there is one, which spares a walk through the anchor’s content. Then wait for
  // the first interaction with the anchor, until which the popover isn’t rendered.
  $effect(() => {
    /* v8 ignore next 3 -- the anchor is bound before the effects run */
    if (!anchor) {
      return undefined;
    }

    const target = anchor;
    const name = target.getAttribute('aria-label') ?? getAccessibleText(target);

    describing = !!text && text !== name;
    setDescribedBy(target, describing);

    // The popover follows the anchor’s events itself once it’s rendered
    const stopWaiting = untrack(() => trigger)
      ? undefined
      : waitForTooltipActivation(target, activate);

    return () => {
      stopWaiting?.();
      setDescribedBy(target, false);
    };
  });
</script>

<!--
  Until the popover is rendered, the description is kept in a hidden element, which
  `aria-describedby` can still refer to. It’s only there when the tooltip describes the anchor.
-->
{#if trigger || open}
  <TooltipPopover {id} {trigger} {anchor} {text} {position} {open} />
{:else if describing}
  <span {id} hidden>{text}</span>
{/if}
