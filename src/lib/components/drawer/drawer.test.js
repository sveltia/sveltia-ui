import { describe, expect, it } from 'vitest';
import {
  addSwipeSample,
  getSwipeDirection,
  getSwipeOffset,
  getSwipeVelocity,
  shouldDismissSwipe,
  SWIPE_VELOCITY_WINDOW,
} from './drawer.js';

describe('getSwipeDirection', () => {
  it('should swipe a top or bottom drawer vertically', () => {
    expect(getSwipeDirection('bottom', false)).toEqual({ axis: 'Y', sign: 1 });
    expect(getSwipeDirection('top', false)).toEqual({ axis: 'Y', sign: -1 });
    // The layout direction doesn’t matter vertically
    expect(getSwipeDirection('bottom', true)).toEqual({ axis: 'Y', sign: 1 });
  });

  it('should swipe a side drawer horizontally, mirrored in a right-to-left layout', () => {
    expect(getSwipeDirection('right', false)).toEqual({ axis: 'X', sign: 1 });
    expect(getSwipeDirection('left', false)).toEqual({ axis: 'X', sign: -1 });
    expect(getSwipeDirection('right', true)).toEqual({ axis: 'X', sign: -1 });
    expect(getSwipeDirection('left', true)).toEqual({ axis: 'X', sign: 1 });
  });
});

describe('getSwipeOffset', () => {
  it('should follow a drag towards the edge', () => {
    expect(getSwipeOffset(40, 1)).toBe(40);
    expect(getSwipeOffset(-40, -1)).toBe(40);
  });

  it('should ignore a drag the other way', () => {
    expect(getSwipeOffset(-40, 1)).toBe(0);
    expect(getSwipeOffset(40, -1)).toBe(0);
  });
});

describe('addSwipeSample', () => {
  it('should keep the samples within the measuring window', () => {
    const samples = [
      { offset: 0, time: 0 },
      { offset: 10, time: 50 },
    ];

    expect(addSwipeSample(samples, { offset: 20, time: SWIPE_VELOCITY_WINDOW })).toEqual([
      ...samples,
      { offset: 20, time: SWIPE_VELOCITY_WINDOW },
    ]);
    expect(addSwipeSample(samples, { offset: 30, time: 120 })).toEqual([
      { offset: 10, time: 50 },
      { offset: 30, time: 120 },
    ]);
  });
});

describe('getSwipeVelocity', () => {
  it('should measure the speed between the first and last samples', () => {
    expect(
      getSwipeVelocity([
        { offset: 10, time: 0 },
        { offset: 20, time: 40 },
        { offset: 60, time: 50 },
      ]),
    ).toBe(1);
    // Heading back
    expect(
      getSwipeVelocity([
        { offset: 60, time: 0 },
        { offset: 20, time: 80 },
      ]),
    ).toBe(-0.5);
  });

  it('should have no speed without enough time to measure', () => {
    expect(getSwipeVelocity([])).toBe(0);
    expect(getSwipeVelocity([{ offset: 10, time: 0 }])).toBe(0);
    expect(
      getSwipeVelocity([
        { offset: 10, time: 5 },
        { offset: 20, time: 5 },
      ]),
    ).toBe(0);
  });
});

describe('shouldDismissSwipe', () => {
  it('should dismiss the drawer dragged far enough', () => {
    expect(shouldDismissSwipe({ offset: 180, size: 600, velocity: 0 })).toBe(true);
    expect(shouldDismissSwipe({ offset: 179, size: 600, velocity: 0 })).toBe(false);
    // Even if the pointer was heading back when released
    expect(shouldDismissSwipe({ offset: 300, size: 600, velocity: -1 })).toBe(true);
  });

  it('should dismiss the drawer flicked towards its edge', () => {
    expect(shouldDismissSwipe({ offset: 20, size: 600, velocity: 0.5 })).toBe(true);
    expect(shouldDismissSwipe({ offset: 20, size: 600, velocity: 0.4 })).toBe(false);
  });

  it('should not take a small movement for a flick, however fast', () => {
    expect(shouldDismissSwipe({ offset: 16, size: 600, velocity: 2 })).toBe(true);
    expect(shouldDismissSwipe({ offset: 15, size: 600, velocity: 2 })).toBe(false);
    // A small drawer is still dismissed by distance
    expect(shouldDismissSwipe({ offset: 15, size: 40, velocity: 0 })).toBe(true);
  });

  it('should leave the drawer that hasn’t moved', () => {
    expect(shouldDismissSwipe({ offset: 0, size: 600, velocity: 2 })).toBe(false);
  });
});
