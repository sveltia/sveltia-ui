<!--
  @component
  The popover of a `<Tooltip>`, rendered once the user first points at or focuses its anchor, or
  when it’s forced open. It follows the anchor’s pointer and focus events from then on, and lives in
  the top layer through the Popover API, so a dialog or a scrolling container can’t clip it. The
  `<Tooltip>` around it describes the anchor with it.
  @see https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
  @see https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html
-->
<script>
  import { untrack } from 'svelte';
  import { getTooltipPosition } from '../../services/tooltip.js';

  /**
   * @import { TooltipPosition } from '../../services/tooltip.js';
   * @import { TooltipTrigger } from '../../services/tooltip-activation.js';
   */

  /**
   * The `<Tooltip>` props, passed on as they are, with the tooltip’s ID, which the anchor’s
   * `aria-describedby` refers to, and the interaction that rendered the tooltip. That happened
   * before the tooltip could listen to the anchor, so it’s handled as soon as it does.
   * @type {{
   * id: string, trigger?: TooltipTrigger, anchor: HTMLElement | undefined, text: string,
   * position?: TooltipPosition, open?: boolean
   * }}
   */
  // eslint-disable-next-line prefer-const
  let { id, trigger = undefined, anchor, text, position = 'auto', open = false } = $props();

  /**
   * How long the pointer has to rest on the anchor before the tooltip shows, in milliseconds.
   */
  const SHOW_DELAY = 500;
  /**
   * How long the tooltip stays after the pointer leaves the anchor, in milliseconds, so the pointer
   * can move onto the tooltip without it disappearing.
   */
  const HIDE_DELAY = 100;

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
  /**
   * Interaction that rendered the tooltip, until it’s handled. Only the first value counts.
   * @type {TooltipTrigger | undefined}
   */
  // svelte-ignore state_referenced_locally
  let pendingTrigger = trigger;

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
   * Show the tooltip after a delay, as the pointer has entered the anchor or the tooltip.
   * @param {number} delay Delay in milliseconds.
   */
  const startHover = (delay) => {
    dismissed = false;
    schedule(() => {
      hovered = true;
    }, delay);
  };

  /**
   * Handle the pointer entering the anchor or the tooltip. Touch is left out, as a tap would show
   * the tooltip on top of what the tap does.
   * @param {PointerEvent} event `pointerenter` event.
   * @param {number} delay Delay in milliseconds.
   */
  const onPointerEnter = (event, delay) => {
    if (event.pointerType !== 'touch') {
      startHover(delay);
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
   * @param {HTMLElement} target Anchor.
   */
  const startFocus = (target) => {
    focused = target.matches(':focus-visible');

    // A click, which also focuses the button, keeps the tooltip dismissed
    if (focused) {
      dismissed = false;
    }
  };

  /**
   * Handle the anchor getting the focus.
   * @param {Event} event `focusin` event.
   */
  const onFocusIn = (event) => {
    startFocus(/** @type {HTMLElement} */ (event.currentTarget));
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
   * Hide the tooltip when the anchor loses the focus. Removing a focused anchor fires the event at
   * once, while the block that removes it is still running, where Svelte forbids a state change
   * unless it’s untracked.
   */
  const onFocusOut = () => {
    untrack(() => {
      focused = false;
    });
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

    // Handle the interaction that rendered the tooltip, once, as if it had been listening already
    if (pendingTrigger === 'pointer') {
      startHover(SHOW_DELAY);
    } else if (pendingTrigger === 'focus') {
      startFocus(target);
    }

    pendingTrigger = undefined;

    return () => {
      clearTimeout(timer);
      listeners.forEach(([type, listener]) => target.removeEventListener(type, listener));
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
