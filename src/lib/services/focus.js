/**
 * Focus management shared by the composite widgets and the overlays.
 */

/**
 * Selector for the elements that can hold focus.
 */
const FOCUSABLE_SELECTOR = 'a[href], button, input, select, textarea, summary, [tabindex]';

/**
 * Move focus to the tab stop next to the given element in document order. Positive `tabindex`
 * values, which reorder the sequence, are not accounted for; they’re discouraged and absent from
 * this library.
 *
 * The candidates are narrowed by attribute alone before any of them is measured, and the measuring
 * — `getClientRects()`, which forces the browser to lay the page out — then walks outward from the
 * element and stops at the first candidate that is actually rendered. Measuring every focusable
 * element in the document up front is what a menu sitting on a large page cannot afford.
 * @internal
 * @param {HTMLElement} element Element to start from.
 * @param {boolean} backwards Whether to move to the previous tab stop rather than the next.
 */
export const focusAdjacentTabStop = (element, backwards) => {
  const candidates = /** @type {HTMLElement[]} */ ([
    ...document.querySelectorAll(FOCUSABLE_SELECTOR),
  ]).filter(
    (candidate) =>
      candidate === element ||
      (candidate.tabIndex >= 0 &&
        !candidate.matches(':disabled, [aria-disabled="true"], [hidden], [inert], [inert] *')),
  );

  const index = candidates.indexOf(element);

  if (index === -1) {
    return;
  }

  const step = backwards ? -1 : 1;

  for (let i = index + step; i >= 0 && i < candidates.length; i += step) {
    if (candidates[i].getClientRects().length) {
      candidates[i].focus();

      return;
    }
  }
};

/**
 * Move focus back to the given element once an overlay has closed — but only if focus is still
 * inside the overlay, or nowhere because the overlay took it down with itself. If it has already
 * moved on — the user tabbed out of a menu, say — pulling it back would undo what they just did.
 * @internal
 * @param {HTMLElement} element Element to move focus to, typically the one that opened the overlay.
 * @param {HTMLElement | null | undefined} container Overlay element.
 */
export const restoreFocus = (element, container) => {
  const { activeElement } = document;

  if (!element.isConnected) {
    return;
  }

  if (!activeElement || activeElement === document.body || container?.contains(activeElement)) {
    element.focus();
  }
};
