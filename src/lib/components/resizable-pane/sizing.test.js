import { describe, expect, it } from 'vitest';
import {
  clampResizeDelta,
  getHandleKeyAction,
  getInitialSizes,
  resolvePaneConstraints,
  resolveToPercent,
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
