import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { findTypeAheadMatch, TYPE_AHEAD_TIMEOUT, TypeAhead } from './type-ahead.js';

describe('TypeAhead', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accumulates quick keystrokes into a lowercase prefix', () => {
    const typeAhead = new TypeAhead();

    expect(typeAhead.push('B')).toBe('b');
    vi.advanceTimersByTime(TYPE_AHEAD_TIMEOUT - 1);
    expect(typeAhead.push('a')).toBe('ba');
  });

  it('drops the prefix after a pause, or on reset', () => {
    const typeAhead = new TypeAhead();

    typeAhead.push('b');
    vi.advanceTimersByTime(TYPE_AHEAD_TIMEOUT);
    expect(typeAhead.push('a')).toBe('a');
    typeAhead.reset();
    expect(typeAhead.push('c')).toBe('c');
  });
});

describe('findTypeAheadMatch', () => {
  const labels = ['apple', 'apricot', 'banana', 'blueberry', 'cherry'];

  it('moves to the next label starting with a single character', () => {
    expect(findTypeAheadMatch(labels, 'b', -1)).toBe(2);
    // The current item is skipped, even if it matches
    expect(findTypeAheadMatch(labels, 'a', 0)).toBe(1);
    expect(findTypeAheadMatch(labels, 'b', 2)).toBe(3);
  });

  it('refines a longer prefix from the current item', () => {
    expect(findTypeAheadMatch(labels, 'ap', -1)).toBe(0);
    expect(findTypeAheadMatch(labels, 'apr', 0)).toBe(1);
    // The current item counts once the prefix is longer than one character
    expect(findTypeAheadMatch(labels, 'bl', 3)).toBe(3);
  });

  it('wraps around', () => {
    expect(findTypeAheadMatch(labels, 'a', 4)).toBe(0);
  });

  it('cycles through the items starting with a repeated character', () => {
    expect(findTypeAheadMatch(labels, 'aa', 0)).toBe(1);
    expect(findTypeAheadMatch(labels, 'aaa', 1)).toBe(0);
    expect(findTypeAheadMatch(labels, 'bb', 2)).toBe(3);
  });

  it('returns -1 when nothing matches or the prefix is empty', () => {
    expect(findTypeAheadMatch(labels, 'z', 0)).toBe(-1);
    expect(findTypeAheadMatch(labels, '', 0)).toBe(-1);
    expect(findTypeAheadMatch([], 'a', -1)).toBe(-1);
  });
});
