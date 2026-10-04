import { describe, expect, it } from 'vitest';
import {
  calculatePopupStyle,
  clipRect,
  flip,
  isShallowEqual,
  mirrorPosition,
} from './popup-position.js';

describe('mirrorPosition', () => {
  it('should swap the alignment suffix of a dropdown', () => {
    expect(mirrorPosition('bottom-left')).toBe('bottom-right');
    expect(mirrorPosition('top-right')).toBe('top-left');
  });

  it('should swap the side prefix of a submenu', () => {
    expect(mirrorPosition('right-top')).toBe('left-top');
    expect(mirrorPosition('left-bottom')).toBe('right-bottom');
  });

  it('should restore the original position when mirrored twice', () => {
    expect(mirrorPosition(mirrorPosition('left-bottom'))).toBe('left-bottom');
  });
});

describe('clipRect', () => {
  it('should keep a rect that is inside the viewport', () => {
    expect(
      clipRect({ top: 10, left: 20, right: 120, bottom: 40 }, { width: 800, height: 600 }),
    ).toEqual({ top: 10, left: 20, right: 120, bottom: 40, width: 100, height: 30 });
  });

  it('should clip a rect that extends beyond the viewport', () => {
    expect(
      clipRect({ top: -20, left: -10, right: 900, bottom: 700 }, { width: 800, height: 600 }),
    ).toEqual({ top: 0, left: 0, right: 800, bottom: 600, width: 800, height: 600 });
  });

  it('should not report a negative size for a rect outside the viewport', () => {
    expect(
      clipRect({ top: 700, left: 900, right: 950, bottom: 750 }, { width: 800, height: 600 }),
    ).toMatchObject({ width: 0, height: 0 });
  });
});

describe('flip', () => {
  const base = /** @type {const} */ ({ position: 'bottom-left', from: 'bottom-', to: 'top-' });

  it('should keep the position without a cap when the content fits', () => {
    expect(flip({ ...base, size: 100, room: 100, otherRoom: 500 })).toEqual({
      position: 'bottom-left',
      cap: undefined,
    });
  });

  it('should flip and cap by the other room when that side has more room', () => {
    expect(flip({ ...base, size: 300, room: 100, otherRoom: 200 })).toEqual({
      position: 'top-left',
      cap: 200,
    });
  });

  it('should stay and cap by the current room when the other side has no more room', () => {
    expect(flip({ ...base, size: 300, room: 200, otherRoom: 200 })).toEqual({
      position: 'bottom-left',
      cap: 200,
    });
  });
});

describe('calculatePopupStyle', () => {
  const viewport = { width: 800, height: 600 };
  const anchorRect = { top: 100, bottom: 150, left: 50, right: 300 };

  it('should place a dropdown below the anchor when it fits', () => {
    expect(
      calculatePopupStyle({
        position: 'bottom-left',
        anchorRect,
        viewport,
        contentWidth: 200,
        contentHeight: 100,
      }),
    ).toEqual({
      inset: '150px auto auto 50px',
      zIndex: 1000,
      minWidth: '250px',
      maxWidth: '742px',
      height: undefined,
    });
  });

  it('should flip a dropdown above the anchor and cap its height', () => {
    // bottomMargin = 500 - 450 - 8 = 42; topMargin = 400 - 8 = 392
    expect(
      calculatePopupStyle({
        position: 'bottom-left',
        anchorRect: { top: 400, bottom: 450, left: 50, right: 300 },
        viewport: { width: 800, height: 500 },
        contentWidth: 200,
        contentHeight: 500,
      }),
    ).toMatchObject({ inset: 'auto auto 100px 50px', height: '392px' });
  });

  it('should flip a top dropdown below the anchor when the top has less room', () => {
    // topMargin = 42; bottomMargin = 492
    expect(
      calculatePopupStyle({
        position: 'top-left',
        anchorRect: { top: 50, bottom: 100, left: 50, right: 300 },
        viewport,
        contentWidth: 200,
        contentHeight: 300,
      }),
    ).toMatchObject({ inset: '100px auto auto 50px', height: '492px' });
  });

  it('should align a right-aligned dropdown with the anchor’s right edge', () => {
    expect(
      calculatePopupStyle({
        position: 'bottom-right',
        anchorRect,
        viewport,
        contentWidth: 200,
        contentHeight: 100,
      }),
    ).toMatchObject({ inset: '150px 500px auto auto', maxWidth: '292px' });
  });

  it('should switch the alignment of a dropdown that overflows horizontally', () => {
    expect(
      calculatePopupStyle({
        position: 'bottom-left',
        anchorRect: { top: 100, bottom: 150, left: 600, right: 700 },
        viewport,
        contentWidth: 250,
        contentHeight: 100,
      }).inset,
    ).toBe('150px 100px auto auto');
    expect(
      calculatePopupStyle({
        position: 'bottom-right',
        anchorRect: { top: 100, bottom: 150, left: 50, right: 100 },
        viewport,
        contentWidth: 290,
        contentHeight: 100,
      }).inset,
    ).toBe('150px auto auto 50px');
  });

  it('should open a submenu beside the anchor, aligned with its top edge', () => {
    expect(
      calculatePopupStyle({
        position: 'right-top',
        anchorRect,
        viewport,
        contentWidth: 200,
        contentHeight: 100,
      }),
    ).toMatchObject({ inset: '100px auto auto 300px', maxWidth: '492px', height: undefined });
  });

  it('should move a submenu to the other side when it overflows', () => {
    // rightMargin = 92; leftMargin = 642
    expect(
      calculatePopupStyle({
        position: 'right-top',
        anchorRect: { top: 100, bottom: 150, left: 650, right: 700 },
        viewport,
        contentWidth: 160,
        contentHeight: 100,
      }),
    ).toMatchObject({ inset: '100px 150px auto auto', maxWidth: '642px' });
    // leftMargin = 42; rightMargin = 692
    expect(
      calculatePopupStyle({
        position: 'left-top',
        anchorRect: { top: 100, bottom: 150, left: 50, right: 100 },
        viewport,
        contentWidth: 160,
        contentHeight: 100,
      }),
    ).toMatchObject({ inset: '100px auto auto 100px', maxWidth: '692px' });
  });

  it('should align a submenu with the anchor’s bottom edge when there is more room above', () => {
    // downwardMargin = 600 - 500 - 8 = 92; upwardMargin = 550 - 8 = 542
    expect(
      calculatePopupStyle({
        position: 'left-top',
        anchorRect: { top: 500, bottom: 550, left: 400, right: 450 },
        viewport,
        contentWidth: 100,
        contentHeight: 300,
      }),
    ).toMatchObject({ inset: 'auto 400px 50px auto', height: '542px' });
  });

  it('should flip a bottom-aligned submenu, or keep and cap it when the top edge has no more room', () => {
    // upwardMargin = 150 - 8 = 142; downwardMargin = 600 - 100 - 8 = 492
    expect(
      calculatePopupStyle({
        position: 'right-bottom',
        anchorRect,
        viewport,
        contentWidth: 100,
        contentHeight: 300,
      }),
    ).toMatchObject({ inset: '100px auto auto 300px', height: '492px' });
    expect(
      calculatePopupStyle({
        position: 'right-bottom',
        anchorRect: { top: 0, bottom: 50, left: 50, right: 300 },
        viewport: { width: 800, height: 50 },
        contentWidth: 100,
        contentHeight: 300,
      }),
    ).toMatchObject({ inset: 'auto auto 0px 300px', height: '42px' });
  });
});

describe('isShallowEqual', () => {
  it('should return `true` for objects with the same keys and values', () => {
    expect(isShallowEqual({ a: 1, b: undefined }, { b: undefined, a: 1 })).toBe(true);
  });

  it('should return `false` when a value differs', () => {
    expect(isShallowEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('should return `false` when the keys differ', () => {
    expect(isShallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(isShallowEqual({ a: undefined }, { b: undefined })).toBe(false);
  });

  it('should not compare nested objects deeply', () => {
    expect(isShallowEqual({ a: {} }, { a: {} })).toBe(false);
  });
});
