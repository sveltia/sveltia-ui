/**
 * Size arithmetic behind `<ResizablePaneGroup>` and `<ResizableHandle>`, kept apart from the
 * components so the conversions and clamping can be tested without laying anything out. Every
 * size here is a percentage of the pane group unless stated otherwise.
 */

import { getArrowKeys } from '../../services/navigation.js';

/**
 * @import { ResizablePaneSize } from '#lib/typedefs.js';
 */

/**
 * @typedef {object} SizeEnvironment
 * @property {number} containerSize Size of the pane group in pixels along its direction, or `0`
 * if it hasn’t been laid out yet.
 * @property {number} viewportWidth Width of the viewport in pixels.
 * @property {number} viewportHeight Height of the viewport in pixels.
 */

/**
 * @typedef {object} PaneConstraints
 * @property {number} minSize Minimum size.
 * @property {number} maxSize Maximum size, never below `minSize`.
 */

/**
 * Resolve a size given as a percentage number or a CSS length string to a percentage.
 * @param {ResizablePaneSize | undefined} value Size as a percentage number, or a CSS size string
 * such as `240px`, `20%` or `20dvw`.
 * @param {number} fallback Percentage to return when the value can’t be resolved.
 * @param {SizeEnvironment} env Sizes the lengths are relative to. A length other than a percentage
 * can’t be resolved while the container has no size.
 * @returns {number} Size in percentage points.
 */
export const resolveToPercent = (value, fallback, env) => {
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

  const { containerSize } = env;

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
    const viewportSize = unit.endsWith('w') ? env.viewportWidth : env.viewportHeight;
    const pixels = (viewportValue / 100) * viewportSize;

    return (pixels / containerSize) * 100;
  }

  return fallback;
};

/**
 * Resolve a pane’s size constraints to percentages, clamped to the `0`–`100` range, with the
 * maximum never below the minimum.
 * @param {{ minSize: ResizablePaneSize, maxSize: ResizablePaneSize } | undefined} paneDef Pane
 * definition, or `undefined` for a pane that hasn’t registered, which is unconstrained.
 * @param {SizeEnvironment} env Sizes the lengths are relative to.
 * @returns {PaneConstraints} Constraints.
 */
export const resolvePaneConstraints = (paneDef, env) => {
  if (!paneDef) {
    return { minSize: 0, maxSize: 100 };
  }

  const minSize = Math.max(0, resolveToPercent(paneDef.minSize, 0, env));
  const maxSize = Math.min(100, resolveToPercent(paneDef.maxSize, 100, env));

  return {
    minSize,
    maxSize: Math.max(minSize, maxSize),
  };
};

/**
 * Spread an amount over some of the panes, as far as their constraints allow. A positive amount
 * grows the panes and a negative one shrinks them.
 * @param {number[]} sizes Size of each pane, updated in place.
 * @param {PaneConstraints[]} constraints Constraints of each pane.
 * @param {number[]} indexes Indexes of the panes to spread the amount over.
 * @param {number} amount Amount to spread.
 * @returns {number} What is left of the amount once the panes are full or empty.
 */
const spreadSize = (sizes, constraints, indexes, amount) => {
  let remaining = amount;
  let adjustable = indexes;

  // Each round either uses up the amount or fills at least one pane, so the loop is bounded
  while (adjustable.length && Math.abs(remaining) > 1e-9) {
    const share = remaining / adjustable.length;

    const moved = adjustable.map((i) => {
      const { minSize, maxSize } = constraints[i];
      const size = Math.min(maxSize, Math.max(minSize, sizes[i] + share));
      const diff = size - sizes[i];

      sizes[i] = size;

      return diff;
    });

    remaining -= moved.reduce((sum, diff) => sum + diff, 0);
    adjustable = adjustable.filter((i) =>
      share > 0 ? sizes[i] < constraints[i].maxSize : sizes[i] > constraints[i].minSize,
    );
  }

  return remaining;
};

/**
 * Work out the initial size of each pane. Panes with a default size get it; the others share
 * whatever is left of the group equally. When constraints are given, each size is then brought
 * within its pane’s constraints, and whatever that frees up or takes away is made up by the other
 * panes, those without a default size first, so the total stays the same where possible.
 * @param {number[]} resolvedDefaults Each pane’s default size as a percentage, or `NaN` for a pane
 * that has none, or whose default couldn’t be resolved.
 * @param {PaneConstraints[]} [constraints] Constraints of each pane.
 * @returns {number[]} Size of each pane.
 */
export const getInitialSizes = (resolvedDefaults, constraints) => {
  const specified = resolvedDefaults.filter((v) => !Number.isNaN(v));
  const totalSpecified = specified.reduce((sum, v) => sum + v, 0);
  const unspecifiedCount = resolvedDefaults.length - specified.length;
  const remaining = Math.max(0, 100 - totalSpecified);
  const defaultSize = unspecifiedCount > 0 ? remaining / unspecifiedCount : 0;
  const sizes = resolvedDefaults.map((v) => (Number.isNaN(v) ? defaultSize : v));

  if (!constraints) {
    return sizes;
  }

  const total = sizes.reduce((sum, v) => sum + v, 0);
  const allConstraints = sizes.map((_v, i) => constraints[i] ?? { minSize: 0, maxSize: 100 });

  const fitted = sizes.map((v, i) =>
    Math.min(allConstraints[i].maxSize, Math.max(allConstraints[i].minSize, v)),
  );

  const indexes = sizes.map((_v, i) => i);
  const unspecified = indexes.filter((i) => Number.isNaN(resolvedDefaults[i]));
  const excess = total - fitted.reduce((sum, v) => sum + v, 0);

  spreadSize(
    fitted,
    allConstraints,
    indexes,
    spreadSize(fitted, allConstraints, unspecified, excess),
  );

  return fitted;
};

/**
 * Clamp the delta a handle is moved by, so neither of the two panes around it leaves its size
 * constraints. A positive delta grows the pane before the handle at the expense of the one after
 * it, and a negative delta does the opposite.
 * @param {number} deltaPercent Requested delta.
 * @param {object} panes The panes around the handle.
 * @param {number} panes.sizeBefore Current size of the pane before the handle.
 * @param {number} panes.sizeAfter Current size of the pane after the handle.
 * @param {PaneConstraints} panes.constraintsBefore Constraints of the pane before the handle.
 * @param {PaneConstraints} panes.constraintsAfter Constraints of the pane after the handle.
 * @returns {number} Delta both panes can accommodate.
 */
export const clampResizeDelta = (
  deltaPercent,
  { sizeBefore, sizeAfter, constraintsBefore, constraintsAfter },
) => {
  // Never below zero, so a pane that is already out of its constraints can’t make the handle move
  // the wrong way
  const canGrow = Math.max(
    0,
    Math.min(constraintsBefore.maxSize - sizeBefore, sizeAfter - constraintsAfter.minSize),
  );

  const canShrink = Math.max(
    0,
    Math.min(sizeBefore - constraintsBefore.minSize, constraintsAfter.maxSize - sizeAfter),
  );

  return deltaPercent > 0 ? Math.min(deltaPercent, canGrow) : -Math.min(-deltaPercent, canShrink);
};

/**
 * Interpret a key pressed on a resize handle. Arrow keys move the handle by 1%, or 10% with Shift.
 * Enter collapses or restores the pane before the handle. Home and End move it to its minimum and
 * maximum; the delta for those is oversized, and gets clamped by {@link clampResizeDelta}.
 * @param {object} options Options.
 * @param {string} options.key The key pressed.
 * @param {boolean} options.shiftKey Whether Shift was held.
 * @param {boolean} options.isHorizontal Whether the panes are laid out horizontally, in which case
 * the handle moves left and right.
 * @param {boolean} options.rtl Whether the layout is right-to-left, which swaps the horizontal
 * arrow keys.
 * @returns {{ type: 'toggle' } | { type: 'resize', delta: number } | undefined} What to do, or
 * `undefined` if the key has no meaning here.
 */
export const getHandleKeyAction = ({ key, shiftKey, isHorizontal, rtl }) => {
  if (key === 'Enter') {
    return { type: 'toggle' };
  }

  if (key === 'Home') {
    return { type: 'resize', delta: -100 };
  }

  if (key === 'End') {
    return { type: 'resize', delta: 100 };
  }

  const step = shiftKey ? 10 : 1;
  const { prevKey, nextKey } = getArrowKeys(isHorizontal ? 'horizontal' : 'vertical', rtl);

  if (key === prevKey) {
    return { type: 'resize', delta: -step };
  }

  if (key === nextKey) {
    return { type: 'resize', delta: step };
  }

  return undefined;
};
