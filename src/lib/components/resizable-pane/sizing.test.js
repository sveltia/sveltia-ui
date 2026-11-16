import { describe, expect, it } from 'vitest';
import {
  clampResizeDelta,
  getHandleKeyAction,
  getHandleRange,
  getInitialSizes,
  getNewPaneSize,
  pixelDeltaToPercent,
  resolveDefaultSize,
  resolvePaneConstraints,
  resolveToPercent,
  shareSpaceAmongPanes,
  sortByDomOrder,
} from './sizing.js';

const env = { containerSize: 1000, viewportWidth: 2000, viewportHeight: 500 };

describe('resolveToPercent', () => {
  it('should pass numbers through', () => {
    expect(resolveToPercent(30, 0, env)).toBe(30);
    expect(resolveToPercent(0, 50, env)).toBe(0);
  });

  it('should fall back for missing or unrecognized values', () => {
    expect(resolveToPercent(undefined, 25, env)).toBe(25);
    expect(resolveToPercent('', 25, env)).toBe(25);
    expect(resolveToPercent('auto', 25, env)).toBe(25);
    expect(resolveToPercent('10em', 25, env)).toBe(25);
    expect(resolveToPercent(/** @type {any} */ (null), 25, env)).toBe(25);
  });

  it('should parse percentages without a container', () => {
    expect(resolveToPercent('40%', 0, { ...env, containerSize: 0 })).toBe(40);
    expect(resolveToPercent(' 12.5% ', 0, env)).toBe(12.5);
  });

  it('should convert pixels relative to the container', () => {
    expect(resolveToPercent('250px', 0, env)).toBe(25);
    expect(resolveToPercent('250PX', 0, env)).toBe(25);
  });

  it('should convert viewport units through the container', () => {
    // 10vw = 200px = 20% of the 1000px container
    expect(resolveToPercent('10vw', 0, env)).toBe(20);
    expect(resolveToPercent('10dvw', 0, env)).toBe(20);
    // 50vh = 250px = 25%
    expect(resolveToPercent('50vh', 0, env)).toBe(25);
    expect(resolveToPercent('50DVH', 0, env)).toBe(25);
  });

  it('should fall back for lengths while the container has no size', () => {
    const unsized = { ...env, containerSize: 0 };

    expect(resolveToPercent('250px', 7, unsized)).toBe(7);
    expect(resolveToPercent('10vw', 7, unsized)).toBe(7);
  });
});

describe('resolvePaneConstraints', () => {
  it('should be unconstrained without a definition', () => {
    expect(resolvePaneConstraints(undefined, env)).toEqual({ minSize: 0, maxSize: 100 });
  });

  it('should resolve the constraints to percentages', () => {
    expect(resolvePaneConstraints({ minSize: '100px', maxSize: 60 }, env)).toEqual({
      minSize: 10,
      maxSize: 60,
    });
  });

  it('should clamp to the 0–100 range', () => {
    expect(resolvePaneConstraints({ minSize: -5, maxSize: 120 }, env)).toEqual({
      minSize: 0,
      maxSize: 100,
    });
  });

  it('should never put the maximum below the minimum', () => {
    expect(resolvePaneConstraints({ minSize: 70, maxSize: 30 }, env)).toEqual({
      minSize: 70,
      maxSize: 70,
    });
  });
});

describe('getInitialSizes', () => {
  it('should share the group equally when nothing is specified', () => {
    expect(getInitialSizes([NaN, NaN, NaN, NaN])).toEqual([25, 25, 25, 25]);
  });

  it('should give the remaining space to the unspecified panes', () => {
    expect(getInitialSizes([30, NaN, NaN])).toEqual([30, 35, 35]);
  });

  it('should keep the specified sizes as they are', () => {
    expect(getInitialSizes([20, 80])).toEqual([20, 80]);
    expect(getInitialSizes([20, 30])).toEqual([20, 30]);
  });

  it('should not go negative when the specified sizes exceed the group', () => {
    expect(getInitialSizes([70, 50, NaN])).toEqual([70, 50, 0]);
  });

  it('should handle an empty group', () => {
    expect(getInitialSizes([])).toEqual([]);
  });

  it('should keep the sizes within the constraints, giving the difference to the other panes', () => {
    const unconstrained = { minSize: 0, maxSize: 100 };

    expect(getInitialSizes([90, NaN], [{ minSize: 0, maxSize: 60 }, unconstrained])).toEqual([
      60, 40,
    ]);
    expect(getInitialSizes([NaN, NaN], [{ minSize: 70, maxSize: 100 }, unconstrained])).toEqual([
      70, 30,
    ]);
    // The panes without a default size make up the difference first
    expect(
      getInitialSizes([30, NaN, NaN], [unconstrained, { minSize: 0, maxSize: 20 }, unconstrained]),
    ).toEqual([30, 20, 50]);
    // Then the others
    expect(getInitialSizes([20, 80], [{ minSize: 30, maxSize: 100 }, unconstrained])).toEqual([
      30, 70,
    ]);
  });

  it('should leave a pane without constraints unconstrained', () => {
    expect(getInitialSizes([90, NaN], [{ minSize: 0, maxSize: 60 }])).toEqual([60, 40]);
  });
});

describe('clampResizeDelta', () => {
  const unconstrained = { minSize: 0, maxSize: 100 };

  it('should pass a delta both panes can take', () => {
    const panes = {
      sizeBefore: 50,
      sizeAfter: 50,
      constraintsBefore: unconstrained,
      constraintsAfter: unconstrained,
    };

    expect(clampResizeDelta(10, panes)).toBe(10);
    expect(clampResizeDelta(-10, panes)).toBe(-10);
  });

  it('should stop growing at the first pane’s maximum', () => {
    expect(
      clampResizeDelta(30, {
        sizeBefore: 50,
        sizeAfter: 50,
        constraintsBefore: { minSize: 0, maxSize: 60 },
        constraintsAfter: unconstrained,
      }),
    ).toBe(10);
  });

  it('should stop growing at the second pane’s minimum', () => {
    expect(
      clampResizeDelta(30, {
        sizeBefore: 50,
        sizeAfter: 50,
        constraintsBefore: unconstrained,
        constraintsAfter: { minSize: 45, maxSize: 100 },
      }),
    ).toBe(5);
  });

  it('should stop shrinking at the first pane’s minimum', () => {
    expect(
      clampResizeDelta(-30, {
        sizeBefore: 50,
        sizeAfter: 50,
        constraintsBefore: { minSize: 40, maxSize: 100 },
        constraintsAfter: unconstrained,
      }),
    ).toBe(-10);
  });

  it('should stop shrinking at the second pane’s maximum', () => {
    expect(
      clampResizeDelta(-30, {
        sizeBefore: 50,
        sizeAfter: 50,
        constraintsBefore: unconstrained,
        constraintsAfter: { minSize: 0, maxSize: 55 },
      }),
    ).toBe(-5);
  });

  it('should never move the other way when a pane is already out of its constraints', () => {
    const panes = {
      sizeBefore: 90,
      sizeAfter: 10,
      constraintsBefore: { minSize: 0, maxSize: 60 },
      constraintsAfter: { minSize: 20, maxSize: 100 },
    };

    expect(clampResizeDelta(10, panes)).toBe(0);
    expect(clampResizeDelta(-10, panes)).toBe(-10);
    expect(
      clampResizeDelta(-10, {
        sizeBefore: 10,
        sizeAfter: 90,
        constraintsBefore: { minSize: 20, maxSize: 100 },
        constraintsAfter: { minSize: 0, maxSize: 60 },
      }),
    ).toBeCloseTo(0);
  });

  it('should return zero when nothing can move', () => {
    expect(
      clampResizeDelta(100, {
        sizeBefore: 50,
        sizeAfter: 50,
        constraintsBefore: { minSize: 50, maxSize: 50 },
        constraintsAfter: unconstrained,
      }),
    ).toBe(0);
  });
});

describe('getHandleKeyAction', () => {
  it('should toggle with Enter', () => {
    expect(
      getHandleKeyAction({ key: 'Enter', shiftKey: false, isHorizontal: true, rtl: false }),
    ).toEqual({ type: 'toggle' });
  });

  it('should jump to the ends with Home and End', () => {
    expect(
      getHandleKeyAction({ key: 'Home', shiftKey: false, isHorizontal: false, rtl: false }),
    ).toEqual({ type: 'resize', delta: -100 });
    expect(
      getHandleKeyAction({ key: 'End', shiftKey: true, isHorizontal: true, rtl: true }),
    ).toEqual({ type: 'resize', delta: 100 });
  });

  it('should move by 1% with the arrows, and by 10% with Shift', () => {
    expect(
      getHandleKeyAction({ key: 'ArrowRight', shiftKey: false, isHorizontal: true, rtl: false }),
    ).toEqual({ type: 'resize', delta: 1 });
    expect(
      getHandleKeyAction({ key: 'ArrowLeft', shiftKey: true, isHorizontal: true, rtl: false }),
    ).toEqual({ type: 'resize', delta: -10 });
  });

  it('should swap the horizontal arrows in RTL', () => {
    expect(
      getHandleKeyAction({ key: 'ArrowRight', shiftKey: false, isHorizontal: true, rtl: true }),
    ).toEqual({ type: 'resize', delta: -1 });
    expect(
      getHandleKeyAction({ key: 'ArrowLeft', shiftKey: false, isHorizontal: true, rtl: true }),
    ).toEqual({ type: 'resize', delta: 1 });
  });

  it('should use the vertical arrows for a vertical group', () => {
    expect(
      getHandleKeyAction({ key: 'ArrowDown', shiftKey: false, isHorizontal: false, rtl: false }),
    ).toEqual({ type: 'resize', delta: 1 });
    expect(
      getHandleKeyAction({ key: 'ArrowUp', shiftKey: true, isHorizontal: false, rtl: true }),
    ).toEqual({ type: 'resize', delta: -10 });
  });

  it('should ignore the arrows of the other axis and unrelated keys', () => {
    expect(
      getHandleKeyAction({ key: 'ArrowUp', shiftKey: false, isHorizontal: true, rtl: false }),
    ).toBeUndefined();
    expect(
      getHandleKeyAction({ key: 'ArrowLeft', shiftKey: false, isHorizontal: false, rtl: false }),
    ).toBeUndefined();
    expect(
      getHandleKeyAction({ key: 'a', shiftKey: false, isHorizontal: true, rtl: false }),
    ).toBeUndefined();
  });
});

describe('shareSpaceAmongPanes', () => {
  /**
   * Get the same constraints for every pane.
   * @returns {{ minSize: number, maxSize: number }} Constraints.
   */
  const getConstraints = () => ({ minSize: 10, maxSize: 60 });

  it('gives the space to the neighbors first', () => {
    const sizes = [30, 30, 40];

    expect(shareSpaceAmongPanes(sizes, { neighbors: [1], amount: 20, getConstraints })).toBe(0);
    expect(sizes).toEqual([30, 50, 40]);
  });

  it('passes the space on to the other panes once a neighbor hits its maximum', () => {
    const sizes = [30, 50, 20];

    expect(shareSpaceAmongPanes(sizes, { neighbors: [1], amount: 30, getConstraints })).toBe(0);
    expect(sizes).toEqual([50, 60, 20]);
  });

  it('takes the space with a negative amount, as far as the minimum sizes allow', () => {
    const sizes = [20, 20, 60];

    expect(
      shareSpaceAmongPanes(sizes, { neighbors: [0, 1], amount: -30, exclude: 2, getConstraints }),
    ).toBe(-10);
    expect(sizes).toEqual([10, 10, 60]);
  });

  it('skips missing panes', () => {
    const sizes = [40, 40];

    expect(shareSpaceAmongPanes(sizes, { neighbors: [-1, 2], amount: 10, getConstraints })).toBe(0);
    expect(sizes).toEqual([50, 40]);
  });
});

describe('getHandleRange', () => {
  const unconstrained = { minSize: 0, maxSize: 100 };

  it('spans the space of both panes when they are unconstrained', () => {
    expect(
      getHandleRange({
        sizeBefore: 30,
        sizeAfter: 40,
        constraintsBefore: unconstrained,
        constraintsAfter: unconstrained,
      }),
    ).toEqual({ min: 0, max: 70 });
  });

  it('is bound by the constraints of the pane before the handle', () => {
    expect(
      getHandleRange({
        sizeBefore: 30,
        sizeAfter: 40,
        constraintsBefore: { minSize: 10, maxSize: 50 },
        constraintsAfter: unconstrained,
      }),
    ).toEqual({ min: 10, max: 50 });
  });

  it('is bound by the constraints of the pane after the handle', () => {
    expect(
      getHandleRange({
        sizeBefore: 30,
        sizeAfter: 40,
        constraintsBefore: unconstrained,
        constraintsAfter: { minSize: 20, maxSize: 50 },
      }),
    ).toEqual({ min: 20, max: 50 });
  });
});

describe('pixelDeltaToPercent', () => {
  it('converts pixels to percentage points of the container', () => {
    expect(
      pixelDeltaToPercent({ delta: 50, containerSize: 500, isHorizontal: true, rtl: false }),
    ).toBe(10);
    expect(
      pixelDeltaToPercent({ delta: -50, containerSize: 500, isHorizontal: false, rtl: false }),
    ).toBe(-10);
  });

  it('flips a horizontal delta in RTL', () => {
    expect(
      pixelDeltaToPercent({ delta: 50, containerSize: 500, isHorizontal: true, rtl: true }),
    ).toBe(-10);
  });

  it('leaves a vertical delta alone in RTL', () => {
    expect(
      pixelDeltaToPercent({ delta: 50, containerSize: 500, isHorizontal: false, rtl: true }),
    ).toBe(10);
  });
});

describe('resolveDefaultSize', () => {
  it('resolves the default size to a percentage', () => {
    expect(resolveDefaultSize({ defaultSize: 30 }, env)).toBe(30);
    expect(resolveDefaultSize({ defaultSize: '250px' }, env)).toBe(25);
  });

  it('returns NaN without a default size, or with one that can’t be resolved', () => {
    expect(resolveDefaultSize({}, env)).toBeNaN();
    expect(resolveDefaultSize({ defaultSize: undefined }, env)).toBeNaN();
    expect(resolveDefaultSize({ defaultSize: '3em' }, env)).toBeNaN();
  });
});

describe('getNewPaneSize', () => {
  const unconstrained = { minSize: 0, maxSize: 100 };

  it('uses the default size', () => {
    expect(getNewPaneSize({ defaultSize: 30, constraints: unconstrained, paneCount: 3 })).toBe(30);
  });

  it('falls back to an equal share of the group', () => {
    expect(getNewPaneSize({ defaultSize: NaN, constraints: unconstrained, paneCount: 4 })).toBe(25);
  });

  it('keeps the size within the constraints', () => {
    const constraints = { minSize: 20, maxSize: 40 };

    expect(getNewPaneSize({ defaultSize: 10, constraints, paneCount: 3 })).toBe(20);
    expect(getNewPaneSize({ defaultSize: 60, constraints, paneCount: 3 })).toBe(40);
    expect(getNewPaneSize({ defaultSize: NaN, constraints, paneCount: 10 })).toBe(20);
  });
});

describe('sortByDomOrder', () => {
  it('sorts the items in the order of their keys', () => {
    const items = [{ id: 'b' }, { id: 'c' }, { id: 'a' }];

    expect(sortByDomOrder(items, ['a', 'b', 'c'], (item) => item.id)).toEqual([
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
    ]);
    // The original array is left as is
    expect(items.map(({ id }) => id)).toEqual(['b', 'c', 'a']);
  });

  it('puts the items missing from the list last, in their current order', () => {
    const items = ['x', 'b', 'y', 'a'];

    expect(sortByDomOrder(items, ['a', 'b'], (item) => item)).toEqual(['a', 'b', 'x', 'y']);
  });
});
