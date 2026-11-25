/**
 * Lazy activation for `<Tooltip>`. A tooltip costs nothing but a map entry until the user first
 * points at or focuses its anchor: one pair of listeners on the anchor’s document or shadow root
 * serves every anchor in it, instead of each tooltip listening to its own anchor and keeping a
 * popover around. A long list of buttons with tooltips, most of which are never hovered, stays
 * cheap that way.
 */

/**
 * What woke a tooltip up: the pointer entering its anchor, or the focus moving into it.
 * @typedef {'pointer' | 'focus'} TooltipTrigger
 */

/**
 * Callbacks waiting for the first interaction with their anchor.
 * @type {WeakMap<Element, Set<(trigger: TooltipTrigger) => void>>}
 */
const anchors = new WeakMap();
/**
 * Documents and shadow roots already listening.
 * @type {WeakSet<Node>}
 */
const roots = new WeakSet();

/**
 * Call the callbacks registered for an anchor, once: they’re dropped right away, as the tooltip
 * follows the anchor’s events itself from then on.
 * @param {Element} anchor Anchor.
 * @param {TooltipTrigger} trigger What woke the tooltip up.
 * @returns {boolean} Whether there were any.
 */
const activate = (anchor, trigger) => {
  const callbacks = anchors.get(anchor);

  if (!callbacks) {
    return false;
  }

  anchors.delete(anchor);
  callbacks.forEach((callback) => callback(trigger));

  return true;
};

/**
 * Wake up the tooltip of the element the pointer enters. `pointerenter` doesn’t bubble, but a
 * listener on the root still sees it in the capture phase, with the element entered as the target.
 * Touch is left out, as the tooltip itself ignores it.
 * @param {Event} event `pointerenter` event.
 */
const onPointerEnter = (event) => {
  if (/** @type {PointerEvent} */ (event).pointerType !== 'touch') {
    activate(/** @type {Element} */ (event.target), 'pointer');
  }
};

/**
 * Wake up the tooltip of the element that gets the focus, or of the closest ancestor that has one.
 * @param {Event} event `focusin` event.
 */
const onFocusIn = (event) => {
  for (
    let node = /** @type {Element | null} */ (event.target);
    node && !activate(node, 'focus');
    node = node.parentElement
  ) {
    // Keep looking
  }
};

/**
 * Wait for the first interaction with a tooltip’s anchor: the pointer entering it, except with
 * touch, or the focus moving into it.
 * @param {Element} anchor Anchor.
 * @param {(trigger: TooltipTrigger) => void} callback Function called once, on the first
 * interaction.
 * @returns {() => void} Function to stop waiting.
 */
export const waitForTooltipActivation = (anchor, callback) => {
  const root = anchor.getRootNode();

  if (!roots.has(root)) {
    roots.add(root);
    root.addEventListener('pointerenter', onPointerEnter, { capture: true, passive: true });
    root.addEventListener('focusin', onFocusIn, { capture: true });
  }

  let callbacks = anchors.get(anchor);

  if (!callbacks) {
    callbacks = new Set();
    anchors.set(anchor, callbacks);
  }

  callbacks.add(callback);

  return () => {
    const current = anchors.get(anchor);

    current?.delete(callback);

    if (current?.size === 0) {
      anchors.delete(anchor);
    }
  };
};
