import { describe, expect, it } from 'vitest';
import {
  clampThumbIndex,
  findNearestStepIndex,
  getNearestThumbIndex,
  getSliderCurrentIndex,
  getSliderKeyDirection,
  getSliderKeyTargetIndex,
  getSliderSteps,
  toLogicalX,
} from './slider.js';

describe('getSliderSteps', () => {
  it('should keep the precision of a step written in exponential notation', () => {
    const { valueList } = getSliderSteps({ min: 0, max: 3e-7, step: 1e-7, barWidth: 300 });

    expect(valueList).toEqual([0, 1e-7, 2e-7, 3e-7]);
  });

  it('should list every value from min to max and spread them over the track', () => {
    const { valueList, positionList } = getSliderSteps({ min: 0, max: 4, step: 1, barWidth: 400 });

    expect(valueList).toEqual([0, 1, 2, 3, 4]);
    expect(positionList).toEqual([0, 100, 200, 300, 400]);
  });

  it('should honor the minimum and the step', () => {
    const { valueList, positionList } = getSliderSteps({
      min: 10,
      max: 20,
      step: 5,
      barWidth: 100,
    });

    expect(valueList).toEqual([10, 15, 20]);
    expect(positionList).toEqual([0, 50, 100]);
  });

  it('should support decimal steps', () => {
    const { valueList } = getSliderSteps({ min: 0, max: 1, step: 0.5, barWidth: 100 });

    expect(valueList).toEqual([0, 0.5, 1]);
  });

  it('should not lose or distort values to floating point errors', () => {
    const { valueList, positionList } = getSliderSteps({
      min: 0,
      max: 0.3,
      step: 0.1,
      barWidth: 300,
    });

    expect(valueList).toEqual([0, 0.1, 0.2, 0.3]);
    expect(positionList).toHaveLength(4);
    expect(positionList[3]).toBeCloseTo(300);
  });

  it('should fall back to a step of 1 for a step that isn’t a positive number', () => {
    [0, -1, NaN, Infinity].forEach((step) => {
      const { valueList, positionList } = getSliderSteps({ min: 0, max: 4, step, barWidth: 400 });

      expect(valueList).toEqual([0, 1, 2, 3, 4]);
      expect(positionList).toEqual([0, 100, 200, 300, 400]);
    });
  });
});

describe('toLogicalX', () => {
  it('should pass the position through in LTR', () => {
    expect(toLogicalX(30, 100, false)).toBe(30);
  });

  it('should mirror the position in RTL', () => {
    expect(toLogicalX(30, 100, true)).toBe(70);
  });

  it('should clamp to the track', () => {
    expect(toLogicalX(-10, 100, false)).toBe(0);
    expect(toLogicalX(120, 100, false)).toBe(100);
    expect(toLogicalX(-10, 100, true)).toBe(100);
    expect(toLogicalX(120, 100, true)).toBe(0);
  });
});

describe('findNearestStepIndex', () => {
  const positionList = [0, 100, 200, 300];

  it('should return the exact step when on it', () => {
    expect(findNearestStepIndex(positionList, 200)).toBe(2);
  });

  it('should pick the closer of the two surrounding steps', () => {
    expect(findNearestStepIndex(positionList, 140)).toBe(1);
    expect(findNearestStepIndex(positionList, 160)).toBe(2);
  });

  it('should pick the later step when exactly halfway', () => {
    expect(findNearestStepIndex(positionList, 150)).toBe(2);
  });

  it('should clamp to the ends', () => {
    expect(findNearestStepIndex(positionList, -50)).toBe(0);
    expect(findNearestStepIndex(positionList, 350)).toBe(3);
  });

  it('should return -1 without any steps', () => {
    expect(findNearestStepIndex([], 10)).toBe(-1);
  });
});

describe('getSliderKeyDirection', () => {
  it('should map the vertical arrows regardless of the layout', () => {
    expect(getSliderKeyDirection('ArrowUp', false)).toBe(1);
    expect(getSliderKeyDirection('ArrowDown', false)).toBe(-1);
    expect(getSliderKeyDirection('ArrowUp', true)).toBe(1);
    expect(getSliderKeyDirection('ArrowDown', true)).toBe(-1);
  });

  it('should follow the visual direction for the horizontal arrows', () => {
    expect(getSliderKeyDirection('ArrowRight', false)).toBe(1);
    expect(getSliderKeyDirection('ArrowLeft', false)).toBe(-1);
    expect(getSliderKeyDirection('ArrowRight', true)).toBe(-1);
    expect(getSliderKeyDirection('ArrowLeft', true)).toBe(1);
  });

  it('should ignore other keys', () => {
    expect(getSliderKeyDirection('Enter', false)).toBe(0);
    expect(getSliderKeyDirection('Home', true)).toBe(0);
  });
});

describe('getSliderKeyTargetIndex', () => {
  const options = { rtl: false, currentIndex: 5, length: 101 };

  it('should step by one with the arrows and by a tenth with the Page keys', () => {
    expect(getSliderKeyTargetIndex({ ...options, key: 'ArrowRight' })).toBe(6);
    expect(getSliderKeyTargetIndex({ ...options, key: 'ArrowLeft' })).toBe(4);
    expect(getSliderKeyTargetIndex({ ...options, key: 'PageUp' })).toBe(15);
    expect(getSliderKeyTargetIndex({ ...options, key: 'PageDown', currentIndex: 50 })).toBe(40);
  });

  it('should jump to the ends with Home and End, and clamp', () => {
    expect(getSliderKeyTargetIndex({ ...options, key: 'Home' })).toBe(0);
    expect(getSliderKeyTargetIndex({ ...options, key: 'End' })).toBe(100);
    expect(getSliderKeyTargetIndex({ ...options, key: 'PageDown' })).toBe(0);
    expect(getSliderKeyTargetIndex({ ...options, key: 'ArrowLeft', currentIndex: 0 })).toBe(-1);
  });

  it('should page by at least one step on a short range', () => {
    expect(getSliderKeyTargetIndex({ key: 'PageUp', rtl: false, currentIndex: 0, length: 3 })).toBe(
      1,
    );
  });

  it('should ignore other keys', () => {
    expect(getSliderKeyTargetIndex({ ...options, key: 'Enter' })).toBe(-1);
  });
});

describe('clampThumbIndex', () => {
  const positionList = [0, 100, 200, 300, 400];
  const sliderPositions = [100, 300];

  it('should let the first thumb move up to one step short of the second one', () => {
    const options = { valueIndex: 0, positionList, sliderPositions };

    expect(clampThumbIndex({ ...options, index: 2 })).toBe(2);
    expect(clampThumbIndex({ ...options, index: 3 })).toBe(2);
    expect(clampThumbIndex({ ...options, index: 4 })).toBe(2);
    expect(clampThumbIndex({ ...options, index: 0 })).toBe(0);
  });

  it('should let the second thumb move down to one step short of the first one', () => {
    const options = { valueIndex: 1, positionList, sliderPositions };

    expect(clampThumbIndex({ ...options, index: 2 })).toBe(2);
    expect(clampThumbIndex({ ...options, index: 1 })).toBe(2);
    expect(clampThumbIndex({ ...options, index: 0 })).toBe(2);
    expect(clampThumbIndex({ ...options, index: 4 })).toBe(4);
  });

  it('should return -1 when there’s no room to move', () => {
    expect(
      clampThumbIndex({ valueIndex: 0, index: 1, positionList, sliderPositions: [0, 0] }),
    ).toBe(-1);
    expect(
      clampThumbIndex({ valueIndex: 1, index: 3, positionList, sliderPositions: [400, 400] }),
    ).toBe(-1);
  });
});

describe('getSliderCurrentIndex', () => {
  const valueList = [0, 10, 20, 30];

  it('should return the index of a value on a step', () => {
    expect(getSliderCurrentIndex({ valueList, value: 20, decreasing: false })).toBe(2);
    expect(getSliderCurrentIndex({ valueList, value: 20, decreasing: true })).toBe(2);
  });

  it('should start from the step below or above a value between two steps', () => {
    expect(getSliderCurrentIndex({ valueList, value: 15, decreasing: false })).toBe(1);
    expect(getSliderCurrentIndex({ valueList, value: 15, decreasing: true })).toBe(2);
  });

  it('should start from outside the range for a value outside it', () => {
    expect(getSliderCurrentIndex({ valueList, value: -5, decreasing: false })).toBe(-1);
    expect(getSliderCurrentIndex({ valueList, value: 35, decreasing: true })).toBe(4);
  });
});

describe('getNearestThumbIndex', () => {
  it('should pick the thumb closest to the position', () => {
    expect(getNearestThumbIndex([100, 300], 0)).toBe(0);
    expect(getNearestThumbIndex([100, 300], 150)).toBe(0);
    expect(getNearestThumbIndex([100, 300], 250)).toBe(1);
    expect(getNearestThumbIndex([100, 300], 400)).toBe(1);
  });

  it('should break a tie by the side of the position', () => {
    expect(getNearestThumbIndex([100, 300], 200)).toBe(0);
    expect(getNearestThumbIndex([200, 200], 100)).toBe(0);
    expect(getNearestThumbIndex([200, 200], 300)).toBe(1);
  });
});
