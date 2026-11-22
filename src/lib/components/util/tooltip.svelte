<!--
  @component
  A tooltip for a button or another focusable element: a short text shown next to it while the
  pointer rests on it or the keyboard focus is on it, hidden again with the Escape key. It lives in
  the top layer through the Popover API, so a dialog or a scrolling container can’t clip it.
  @see https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
  @see https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html
-->
<script>
  import { getAccessibleText, getTooltipPosition, toggleIdInList } from '../../services/tooltip.js';

  /**
   * @import { TooltipPosition } from '../../services/tooltip.js';
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

  /**
   * How long the pointer has to rest on the anchor before the tooltip shows, in milliseconds.
   */
  const SHOW_DELAY = 500;
  /**
   * How long the tooltip stays after the pointer leaves the anchor, in milliseconds, so the pointer
   * can move onto the tooltip without it disappearing.
   */
  const HIDE_DELAY = 100;

  const id = $props.id();

  /** @type {HTMLElement | undefined} */
  let element = $state();
  let hovered = $state(false);
  let focused = $state(false);
  /** Whether the Escape key has dismissed the tooltip, until the pointer or focus comes back. */
  let dismissed = $state(false);
  let top = $state(0);
  let left = $state(0);
  /** @type {'top' | 'bottom' | 'left' | 'right'} */
  let placement = $state('bottom');
  let timer = 0;

  const visible = $derived(!!text && (open || ((hovered || focused) && !dismissed)));

  /**
   * Run a function after a delay, replacing any pending one.
   * @param {() => void} fn Function.
   * @param {number} delay Delay in milliseconds.
   */
  const schedule = (fn, delay) => {
    clearTimeout(timer);
    timer = /** @type {number} */ (/** @type {unknown} */ (setTimeout(fn, delay)));
  };

  /**
   * Handle the pointer entering the anchor or the tooltip. Touch is left out, as a tap would show
   * the tooltip on top of what the tap does.
   * @param {PointerEvent} event `pointerenter` event.
   * @param {number} delay Delay in milliseconds.
   */
  const onPointerEnter = (event, delay) => {
    if (event.pointerType !== 'touch') {
      dismissed = false;
      schedule(() => {
        hovered = true;
      }, delay);
    }
  };

  /**
   * Handle the pointer leaving the anchor or the tooltip.
   */
  const onPointerLeave = () => {
    schedule(() => {
      hovered = false;
    }, HIDE_DELAY);
  };

  /**
   * Place the tooltip next to the anchor.
   */
  const updatePosition = () => {
    /* v8 ignore next 3 -- only called while both are rendered */
    if (!anchor || !element) {
      return;
    }

    ({ top, left, placement } = getTooltipPosition({
      anchorRect: anchor.getBoundingClientRect(),
      viewport: { width: window.innerWidth, height: window.innerHeight },
      size: { width: element.offsetWidth, height: element.offsetHeight },
      position,
      rtl: anchor.matches(':dir(rtl)'),
    }));
  };

  /**
   * Handle the pointer entering the anchor, after the usual delay.
   * @param {Event} event `pointerenter` event.
   */
  const onAnchorPointerEnter = (event) => {
    onPointerEnter(/** @type {PointerEvent} */ (event), SHOW_DELAY);
  };

  /**
   * Show the tooltip when the anchor gets the keyboard focus. A click focuses a button too, but the
   * pointer covers that case.
   * @param {Event} event `focusin` event.
   */
  const onFocusIn = (event) => {
    focused = /** @type {HTMLElement} */ (event.currentTarget).matches(':focus-visible');

    // A click, which also focuses the button, keeps the tooltip dismissed
    if (focused) {
      dismissed = false;
    }
  };

  /**
   * Hide the tooltip when the anchor is pressed, as it would cover what the press opens, such as a
   * menu, until the pointer comes back. A tooltip forced open, like a copy confirmation, still
   * shows.
   */
  const onPointerDown = () => {
    clearTimeout(timer);
    dismissed = true;
  };

  /**
   * Hide the tooltip when the anchor loses the focus.
   */
  const onFocusOut = () => {
    focused = false;
  };

  // Follow the anchor’s pointer and focus events
  $effect(() => {
    /* v8 ignore next 3 -- the anchor is bound before the effects run */
    if (!anchor) {
      return undefined;
    }

    const target = anchor;

    /** @type {[string, EventListener][]} */
    const listeners = [
      ['pointerenter', onAnchorPointerEnter],
      ['pointerleave', onPointerLeave],
      ['pointerdown', onPointerDown],
      ['focusin', onFocusIn],
      ['focusout', onFocusOut],
    ];

    listeners.forEach(([type, listener]) => target.addEventListener(type, listener));

    return () => {
      clearTimeout(timer);
      listeners.forEach(([type, listener]) => target.removeEventListener(type, listener));
    };
  });

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

  // Describe the anchor with the tooltip, unless the tooltip only repeats its name, which would be
  // read out twice, as it is for an icon button whose tooltip shows its label
  $effect(() => {
    /* v8 ignore next 3 -- the anchor is bound before the effects run */
    if (!anchor) {
      return undefined;
    }

    const target = anchor;
    const name = target.getAttribute('aria-label') ?? getAccessibleText(target);

    setDescribedBy(target, !!text && text !== name);

    return () => {
      setDescribedBy(target, false);
    };
  });

  // Show and place the tooltip, and keep it next to the anchor while it’s shown
  $effect(() => {
    /* v8 ignore next 3 -- the element is rendered with the component */
    if (!element?.showPopover) {
      return undefined;
    }

    const popover = element;

    if (!visible) {
      if (popover.matches(':popover-open')) {
        popover.hidePopover();
      }

      return undefined;
    }

    if (!popover.matches(':popover-open')) {
      popover.showPopover();
    }

    updatePosition();

    /**
     * Dismiss the tooltip with the Escape key, without moving the focus. The key is used up, so it
     * doesn’t also close a dialog or a popup the anchor is in; the next press does. A tooltip
     * forced open, like a copy confirmation, goes away on its own instead.
     * @param {KeyboardEvent} event `keydown` event.
     */
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !open) {
        event.preventDefault();
        event.stopPropagation();
        dismissed = true;
      }
    };

    // Its size changes with its text, e.g. from a label to “Copied”, so it’s centred again
    const resizeObserver = new ResizeObserver(updatePosition);

    resizeObserver.observe(popover);
    window.addEventListener('scroll', updatePosition, { capture: true, passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });
    window.addEventListener('keydown', onKeyDown, { capture: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('scroll', updatePosition, { capture: true });
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('keydown', onKeyDown, { capture: true });
    };
  });
</script>

<div
  bind:this={element}
  {id}
  role="tooltip"
  popover="manual"
  class="sui tooltip {placement}"
  style:top="{top}px"
  style:left="{left}px"
  onpointerenter={(event) => onPointerEnter(event, 0)}
  onpointerleave={onPointerLeave}
>
  {text}
</div>

<style lang="scss">
  @use '../../styles/mixins';

  // The same surface as a popup or a menu, in the current theme, rather than an inverted one
  .tooltip {
    position: fixed;
    inset: auto;
    margin: 0;
    padding: 4px 8px;
    max-width: min(320px, calc(100vw - 12px));
    font-family: var(--sui-font-family-default);
    font-size: var(--sui-font-size-small);
    font-weight: var(--sui-font-weight-normal, normal);
    line-height: var(--sui-line-height-compact, 1.4);
    text-align: center;
    overflow-wrap: anywhere;
    white-space: normal;

    @include mixins.popup-surface;
    @include mixins.popup-border(tooltip);

    // A lighter shadow than a popup’s, as a tooltip is small and close to its anchor
    box-shadow: 0 2px 6px var(--sui-tooltip-shadow-color, hsl(var(--sui-shadow-color) / 20%));
  }
</style>
