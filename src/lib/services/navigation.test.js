import { describe, expect, it } from 'vitest';
import { getArrowKeys, getGridTargetIndex, getLinearTargetIndex } from './navigation.js';

describe('getArrowKeys', () => {
  it('uses the inline arrows for a horizontal layout, mirrored for RTL', () => {
    expect(getArrowKeys('horizontal', false)).toEqual({
      prevKey: 'ArrowLeft',
      nextKey: 'ArrowRight',
    });
    expect(getArrowKeys('horizontal', true)).toEqual({
      prevKey: 'ArrowRight',
      nextKey: 'ArrowLeft',
    });
  });

  it('uses the block arrows for a vertical layout, regardless of the direction', () => {
    expect(getArrowKeys('vertical', false)).toEqual({ prevKey: 'ArrowUp', nextKey: 'ArrowDown' });
    expect(getArrowKeys('vertical', true)).toEqual({ prevKey: 'ArrowUp', nextKey: 'ArrowDown' });
  });
});

describe('getLinearTargetIndex', () => {
  const keys = { prevKey: 'ArrowUp', nextKey: 'ArrowDown' };
  /**
   * Shorthand for the function under test.
   * @param {string} key Pressed key.
   * @param {number} index Current index.
   * @param {number} [count] Number of members.
   * @returns {number} Result.
   */
  const move = (key, index, count = 3) => getLinearTargetIndex({ key, index, count, ...keys });

  it('moves to the adjacent member', () => {
    expect(move('ArrowDown', 0)).toBe(1);
    expect(move('ArrowUp', 2)).toBe(1);
  });

  it('wraps around at either end', () => {
    expect(move('ArrowDown', 2)).toBe(0);
    expect(move('ArrowUp', 0)).toBe(2);
  });

  it('starts from either end with nothing current', () => {
    expect(move('ArrowDown', -1)).toBe(0);
    expect(move('ArrowUp', -1)).toBe(2);
  });

  it('finds nothing to move to without members', () => {
    expect(move('ArrowUp', -1, 0)).toBe(-1);
  });

  it('ignores the other keys', () => {
    expect(move('ArrowLeft', 1)).toBe(-1);
    expect(move('a', 1)).toBe(-1);
  });
});

describe('getGridTargetIndex', () => {
  /**
   * Shorthand for the function under test, with 3 columns over 8 members in an LTR layout.
   * @param {string} key Pressed key.
   * @param {number} index Current index.
   * @param {object} [options] Options.
   * @param {number} [options.count] Number of members.
   * @param {boolean} [options.rtl] Whether the layout runs right to left.
   * @returns {number} Result.
   */
  const move = (key, index, { count = 8, rtl = false } = {}) =>
    getGridTargetIndex({
      key,
      index,
      count,
      columnCount: 3,
      ...getArrowKeys('horizontal', rtl),
    });

  it('moves by a row with the vertical arrows', () => {
    expect(move('ArrowDown', 1)).toBe(4);
    expect(move('ArrowUp', 4)).toBe(1);
  });

  it('stops at the first member and reaches a partial last row', () => {
    expect(move('ArrowUp', 1)).toBe(0);
    expect(move('ArrowDown', 5)).toBe(7);
  });

  it('moves by a member with the inline arrows, mirrored for RTL', () => {
    expect(move('ArrowRight', 1)).toBe(2);
    expect(move('ArrowLeft', 1)).toBe(0);
    expect(move('ArrowRight', 1, { rtl: true })).toBe(0);
    expect(move('ArrowLeft', 1, { rtl: true })).toBe(2);
  });

  it('doesn’t wrap around at either end', () => {
    expect(move('ArrowUp', 0)).toBe(-1);
    expect(move('ArrowLeft', 0)).toBe(-1);
    expect(move('ArrowDown', 7)).toBe(-1);
    expect(move('ArrowRight', 7)).toBe(-1);
  });

  it('starts from either end with nothing current', () => {
    expect(move('ArrowDown', -1)).toBe(0);
    expect(move('ArrowRight', -1)).toBe(0);
    expect(move('ArrowLeft', -1, { rtl: true })).toBe(0);
    expect(move('ArrowUp', -1)).toBe(7);
    expect(move('ArrowLeft', -1)).toBe(7);
    expect(move('ArrowRight', -1, { rtl: true })).toBe(7);
    expect(move('ArrowUp', -1, { count: 0 })).toBe(-1);
  });

  it('ignores the other keys', () => {
    expect(move('Enter', -1)).toBe(-1);
    expect(move('Enter', 3)).toBe(-1);
  });
});
