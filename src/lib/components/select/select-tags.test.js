import { describe, expect, it } from 'vitest';
import { getDropIndex, getDropTarget, getKeyboardMoveTarget, moveItem } from './select-tags.js';

describe('moveItem', () => {
  it('should move an item forward', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('should move an item backward', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('should return the same list when nothing moves', () => {
    const list = ['a', 'b'];

    expect(moveItem(list, 1, 1)).toBe(list);
  });

  it('should not modify the given list', () => {
    const list = ['a', 'b', 'c'];

    moveItem(list, 0, 2);
    expect(list).toEqual(['a', 'b', 'c']);
  });
});

describe('getKeyboardMoveTarget', () => {
  it('should swap with the previous or next tag', () => {
    expect(getKeyboardMoveTarget({ key: 'ArrowLeft', index: 2, length: 4, rtl: false })).toBe(1);
    expect(getKeyboardMoveTarget({ key: 'ArrowRight', index: 2, length: 4, rtl: false })).toBe(3);
  });

  it('should swap the arrows in RTL', () => {
    expect(getKeyboardMoveTarget({ key: 'ArrowRight', index: 2, length: 4, rtl: true })).toBe(1);
    expect(getKeyboardMoveTarget({ key: 'ArrowLeft', index: 2, length: 4, rtl: true })).toBe(3);
  });

  it('should move to either end with Home and End', () => {
    expect(getKeyboardMoveTarget({ key: 'Home', index: 2, length: 4, rtl: false })).toBe(0);
    expect(getKeyboardMoveTarget({ key: 'End', index: 1, length: 4, rtl: false })).toBe(3);
  });

  it('should not move past the ends', () => {
    expect(getKeyboardMoveTarget({ key: 'ArrowLeft', index: 0, length: 4, rtl: false })).toBe(-1);
    expect(getKeyboardMoveTarget({ key: 'Home', index: 0, length: 4, rtl: false })).toBe(-1);
    expect(getKeyboardMoveTarget({ key: 'ArrowRight', index: 3, length: 4, rtl: false })).toBe(-1);
    expect(getKeyboardMoveTarget({ key: 'End', index: 3, length: 4, rtl: false })).toBe(-1);
  });

  it('should ignore other keys', () => {
    expect(getKeyboardMoveTarget({ key: 'Enter', index: 1, length: 4, rtl: false })).toBe(-1);
    expect(getKeyboardMoveTarget({ key: 'ArrowUp', index: 1, length: 4, rtl: false })).toBe(-1);
  });
});

describe('getDropIndex', () => {
  const rect = { left: 100, width: 50 };

  it('should insert before the tag when the pointer is in its first half', () => {
    expect(getDropIndex({ index: 2, clientX: 110, rect, rtl: false })).toBe(2);
  });

  it('should insert after the tag when the pointer is in its second half', () => {
    expect(getDropIndex({ index: 2, clientX: 140, rect, rtl: false })).toBe(3);
  });

  it('should mirror the halves in RTL, where the list starts on the right', () => {
    expect(getDropIndex({ index: 2, clientX: 110, rect, rtl: true })).toBe(3);
    expect(getDropIndex({ index: 2, clientX: 140, rect, rtl: true })).toBe(2);
  });
});

describe('getDropTarget', () => {
  it('should ignore a drop on either side of the dragged tag', () => {
    expect(getDropTarget(2, 2)).toBeUndefined();
    expect(getDropTarget(2, 3)).toBeUndefined();
  });

  it('should account for the tag leaving its slot when dropped further on', () => {
    expect(getDropTarget(0, 3)).toBe(2);
    expect(getDropTarget(1, 4)).toBe(3);
  });

  it('should use the insertion index as is when dropped earlier', () => {
    expect(getDropTarget(3, 0)).toBe(0);
    expect(getDropTarget(3, 1)).toBe(1);
  });
});
