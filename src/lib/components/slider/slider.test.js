import { describe, expect, it } from 'vitest';
import {
  findNearestStepIndex,
  getSliderKeyDirection,
  getSliderSteps,
  toLogicalX,
  wouldCrossThumbs,
} from './slider.js';

describe('getSliderSteps', () => {
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

describe('wouldCrossThumbs', () => {
  const sliderPositions = [100, 300];

  it('should stop the first thumb at the second one', () => {
    expect(wouldCrossThumbs({ valueIndex: 0, targetPosition: 200, sliderPositions })).toBe(false);
    expect(wouldCrossThumbs({ valueIndex: 0, targetPosition: 300, sliderPositions })).toBe(true);
    expect(wouldCrossThumbs({ valueIndex: 0, targetPosition: 400, sliderPositions })).toBe(true);
  });

  it('should stop the second thumb at the first one', () => {
    expect(wouldCrossThumbs({ valueIndex: 1, targetPosition: 200, sliderPositions })).toBe(false);
    expect(wouldCrossThumbs({ valueIndex: 1, targetPosition: 100, sliderPositions })).toBe(true);
    expect(wouldCrossThumbs({ valueIndex: 1, targetPosition: 0, sliderPositions })).toBe(true);
  });
});
